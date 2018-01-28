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
        return fetch(`${process.env.OHANA_URL}/search?lat_lng=${req.query.lat},${req.query.lng}&category=${category}`);
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
        }
      }
    }
  ).then(
    () => {
      if (req.query.phone) {
        const userRef = db.ref(req.query.phone);
        const ref1 = userRef.child(response.sessionId);
        const ref2 = ref1.push();
        ref2.set({
          timestamp: Date.now(),
          sessionId: response.sessionId,
          request: req.query,
          response: response,
          dialogFlowResponse: JSON.stringify(dialogFlowResponse)
        }).catch((err) => console.log('firebase error'));
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
