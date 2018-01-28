import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import * as Types from './types';
import * as uuidv1 from 'uuid/v1';

import { DialogFlow } from './utils/DialogFlow';
import { HashObject } from './types';

const sessions: HashObject = {};

export const search = (req: Request, res: Response, next: NextFunction) => {
  console.log('[search.controller]', 'query', req.query);

  const response: HashObject = {
    sessionId: req.query.sessionId || uuidv1(),
    success: true,
  };

  sessions[response.sessionId] = sessions[response.sessionId] || {};
  sessions[response.sessionId].updated_at = Date.now();

  return Promise.resolve().then(
    () => {
      return DialogFlow.Search(response.sessionId, req.query.queryText || 'health');
    }
  ).then(
    (data: HashObject) => {
      console.log('[search.controller]', 'data', data);
      const result = (data || {}).result || {};
      console.log('[search.controller]', 'action', result.action || '');
      response.text = (result.fulfillment || {}).speech || '';
      if (result.actionIncomplete) {
        return '';
      }

      console.log('[search.controller]', '500', result.action);
      return (result.action || 'health').replace(/FX\-/i, '');
    }
  ).then(
    (category: string) => {
      if (category) {
        return fetch(`https://api.smc-connect.org/search?lat_lng=${req.query.lat},${req.query.lng}&category=${category}`);
      }
    }
  ).then(
    (data) => {
      if (data) {
        return data.json();
      }
    }
  ).then(
    (data) => {
      if (data) {
        response.data = data;
        console.log('[search.controller]', '600', response);
      }
    }
  ).then(
    () => {
      res.json(response).end();
    }
  ).catch(
    (err) => {
      console.log('[search.controller]', 'search', 'error', err);
      res.json({success: false, error: err}).end();
    }
  );
};
