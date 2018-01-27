import { default as chalk } from 'chalk';
import * as path from 'path';
import * as express from 'express';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';
import * as errorHandler from 'errorhandler';

import * as _ from 'lodash';
import * as glob from 'glob';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Session from 'express-session';
import * as expressValidator from 'express-validator';
import * as helmet from 'helmet';
// import * as lusca from 'lusca';

import * as searchController from './search.controller';

export default class App {
  private app: express.Application = express();
  private session: any;

  // read the .env file and setup environment properties
  private setupEnv(): Promise<any> {
    return Promise.resolve(fs.existsSync('.env') ? dotenv.config() : console.log(chalk.red('no .env file found.')));
  }

  private setupLogger(): Promise<any> {
    return Promise.resolve().then(() => logger('dev'));
  }

  private setupSessionStore(): Promise<any> {
    return Promise.resolve().then(
      () => {
      }
    );
  }

  private setupExpress(): Promise<any> {
    return Promise.resolve().then(
      () => {
        this.app.set('title', process.env.title || 'felix');
        this.app.set('env', process.env.NODE_ENV || process.env.env || 'development');
        this.app.set('port', process.env.PORT || 3000);
        this.app.use(compression());
        this.app.use(cookieParser());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(expressValidator());
        // this.app.use(this.session);
        // this.app.use(lusca({
        //   csrf: {
        //     angular: true
        //   },
        //   csp: {
        //     policy: {
        //     }
        //   },
        //   xframe: 'SAMEORIGIN',
        //   p3p: 'ABCDEF',
        //   hsts: {maxAge: 31536000, includeSubDomains: true, preload: true},
        //   xssProtection: true,
        //   nosniff: true,
        //   referrerPolicy: 'no-referrer'
        // }));
      }
    );
  }


  private setupRoutes(): Promise<any> {
    return Promise.resolve().then(
      () => {

        this.app.get('/search', searchController.search);
        this.app.post('/search', searchController.search);

        // load default endpoints (includes all UI endpoints)
        this.app.use(express.static(path.resolve(__dirname, 'public')));
        this.app.get('*', (req, res, next) => {
          res.sendFile('index.html', { root: path.resolve(__dirname, 'public') }, next);
        });
     }
    );
  }

  private setupErrorHandler(): Promise<any> {
    return Promise.resolve().then(
      () => this.app.use(errorHandler())
    );
  }

  private setupSocketIO(): Promise<any> {
    return Promise.resolve();
  }

  private startServer(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.app.listen(this.app.get('port'), (err: any) => {
        if (err) {
          return reject(err);
        }

        console.log('--');
        console.log(chalk.green(`Environment:\t\t\t ${this.app.get('title')}`));
        console.log(chalk.green(`Environment:\t\t\t ${process.env.NODE_ENV}`));
        if (process.env.NODE_ENV === 'secure') {
            console.log(chalk.green('HTTPs:\t\t\t\ton'));
        }
        console.log('--');

        console.log(chalk.green(`App is running at http://localhost:${this.app.get('port')} in ${this.app.get('env')} mode`));
        console.log(`Press CTRL-C to stop`);

        resolve(true);
      });
    });
  }

  private init(): Promise<express.Application> {
    return Promise.resolve()
      .then(() => this.setupEnv())
      .then(() => this.setupLogger())
      .then(() => this.setupSessionStore())
      .then(() => this.setupExpress())
      .then(() => this.setupRoutes())
      .then(() => this.setupErrorHandler())
      .then(() => this.setupSocketIO())
      .then(() => this.startServer())
      .then(() => this.app)
      .catch((err) => {
        console.log(chalk.red('[app.ts]', 'init', 'err', err));
        return err;
      });
  }

  constructor() {
    console.log('[app.ts]', 'constructor');
  }

  public static Start(): Promise<express.Application> {
    return (new App()).init();
  }
}
