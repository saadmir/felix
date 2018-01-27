import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import fetch from 'node-fetch';
import * as Types from './types';

export const search = (req: Request, res: Response, next: NextFunction) => {
  console.log('[search.controller]', 'query', req.params);

  return Promise.resolve().then(
    () => {
      return fetch('http://54.177.38.37:8080/api/search?lat_lng=37.468614,-122.2067982&category=Health');
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
