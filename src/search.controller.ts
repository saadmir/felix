import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import * as Types from './types';

export const search = (req: Request, res: Response, next: NextFunction) => {
  console.log('[search.controller]', 'query', req.query);

  return Promise.resolve().then(
    () => {
      return fetch(`https://api.smc-connect.org/search?lat_lng=${req.query.lat},${req.query.lng}&category=Health`);
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
