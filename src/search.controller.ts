import { Request, Response, NextFunction } from 'express';
import * as _ from 'lodash';
import * as Types from './types';

export const search = (req: Request, res: Response, next: NextFunction) => {
  console.log('[search.controller]', 'query', req.params);

  return Promise.resolve().then(
    (data) => {
      res.json({success: true, data: req.params}).end();
    }
  ).catch(
    (err) => {
      console.log('[search.controller]', 'search', 'error', err);
      res.json({success: false, error: err}).end();
    }
  );
};
