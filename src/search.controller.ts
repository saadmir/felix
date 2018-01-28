import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import * as Types from './types';


import { DialogFlow } from './utils/DialogFlow';
import { HashObject } from './types';

export const search = (req: Request, res: Response, next: NextFunction) => {
  console.log('[search.controller]', 'query', req.query);

  return Promise.resolve().then(
    () => {
      return DialogFlow.Search(req.query.queryText || 'health');
    }
  ).then(
    (data: HashObject) => {
      console.log('[search.controller]', 'result', ((data || {}).result || {}).action || '');
      return (((data || {}).result || {}).action || 'health').replace(/FX\-/i, '');
    }
  ).then(
    (category) => {
      return fetch(`https://api.smc-connect.org/search?lat_lng=${req.query.lat},${req.query.lng}&category=${category}`);
    }
  ).then(
    res => res.json()
  ).then(
    (data) => {
      res.json({success: true, data}).end();
    }
  ).catch(
    (err) => {
      console.log('[search.controller]', 'search', 'error', err);
      res.json({success: false, error: err}).end();
    }
  );
};
