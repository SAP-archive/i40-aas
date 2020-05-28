import { Request, Response, NextFunction, Router } from 'express';
import cors from 'cors';
import parser from 'body-parser';
import compression from 'compression';
import * as basicAuth from 'express-basic-auth';
const logger = require('aas-logger/lib/log');

//const dotenv = require('dotenv');
//dotenv.config();

//add a handler for debugging that logs all requests
export const handleLogRequest = (router: Router) => {
  router.use((req: Request, res: Response, next:NextFunction) => {
    logger.debug("Incoming request.path to Registry:  "+ JSON.stringify(req.path));
    next();
  });
};




export const handleCors = (router: Router) =>
  router.use(cors({ credentials: true, origin: true }));

export const handleBodyRequestParsing = (router: Router) => {
  router.use(parser.urlencoded({ extended: true }));
  router.use(parser.json());
};

export const handleCompression = (router: Router) => {
  router.use(compression());
};

let user: any = {};
if (
  process.env.CORE_REGISTRIES_ENDPOINTS_USER &&
  process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD
) {
  user[process.env.CORE_REGISTRIES_ENDPOINTS_USER] =
    process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD;
} else {
  console.log('No user defined!');
}
export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true,
    })
  );
