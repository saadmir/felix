import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import * as Types from './types';
import * as uuidv1 from 'uuid/v1';
import * as firebase from 'firebase-admin';

import { DialogFlow } from './utils/DialogFlow';
import { HashObject } from './types';


const serviceAccount = require("../firebase.json");

const sessions: HashObject = {};
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://hacks-8372f.firebaseio.com"
});

export const search = (req: Request, res: Response, next: NextFunction) => {
  console.log('[search.controller]', 'query', req.query);

  const db = firebase.database();

  let dialogFlowResponse = {};
  let parameters: string = '';
  const response: HashObject = {
    sessionId: req.query.sessionId || uuidv1(),
    data: [],
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
      dialogFlowResponse = data;
      const result = (data || {}).result || {};
      parameters = (_.values(result.parameters || {}) || []).join(',');
      console.log('[search.controller]', 'action', result.action || '');
      response.text = (result.fulfillment || {}).speech || '';
      if (result.actionIncomplete) {
        return '';
      }

      return (result.action || 'health').replace(/FX\-/i, '');
    }
  ).then(
    (category: string) => {
      if (category) {
        let url = `${process.env.OHANA_URL}/search?lat_lng=${req.query.lat},${req.query.lng}&category=${category}`;
        if (parameters && parameters.length > 1) {
          url = `${url}&parameters=${parameters}`;
        }

        console.log(url);
        return fetch(url);
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
        if (data.length) {
          response.data = data;
        } else {
          response.text = process.env.EMPTY_RESULT_TEXT;
          const sessionId = response.sessionId;
          const data = {
            sessionId: sessionId,
            timestamp: Date.now(),
            phone: req.query.phone
          };
          db.ref('community_requests').child(sessionId).push().set(data).catch((err) => console.log('firebase error', 'community_requests'));
          delete response.sessionId;
        }
      }
    }
  ).then(
    () => {
      if (response.sessionId) {
        const data = {
          request: req.query,
          sessionId: response.sessionId,
          response: JSON.stringify(response),
          timestamp: Date.now(),
          dialogFlowResponse: JSON.stringify(dialogFlowResponse)
        };
        db.ref(req.query.phone).child(response.sessionId).push().set(data).catch((err) => console.log('firebase error', 'conversation'));
      }
      res.json(response).end();
    }
  ).catch(
    (err) => {
      console.log('[search.controller]', 'search', 'error', err);
      res.json({success: false, error: err}).end();
    }
  );
};
