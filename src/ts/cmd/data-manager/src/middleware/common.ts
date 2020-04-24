import { Router } from 'express';
import cors from 'cors';
import parser from 'body-parser';
import compression from 'compression';

const logger = require('aas-logger/lib/log');

import * as basicAuth from 'express-basic-auth';

let CORE_DATA_MANAGER_USER: string | undefined =
  process.env.CORE_DATA_MANAGER_USER;
let CORE_DATA_MANAGER_PASSWORD: string | undefined =
  process.env.CORE_DATA_MANAGER_PASSWORD;

if (!CORE_DATA_MANAGER_USER || !CORE_DATA_MANAGER_PASSWORD) {
  logger.error(
    ' [Basic auth] No  username or password was found in environment'
  );
}

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
if (CORE_DATA_MANAGER_USER && CORE_DATA_MANAGER_PASSWORD) {
  user[CORE_DATA_MANAGER_USER] = CORE_DATA_MANAGER_PASSWORD;
}
export const handleBasicAuth = (router: Router) =>
  router.use(
    basicAuth.default({
      users: user,
      challenge: true,
    })
  );
