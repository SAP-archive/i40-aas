import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import routes from './services';
import middleware from './middleware';
import errors from './error-handling';

//Do not remove the next line as it initializes the logger

const logger = require('aas-logger/lib/log');
const router = express();
applyMiddleware(middleware, router);
applyRoutes(routes, router);
applyMiddleware(errors, router);

const PORT = checkEnvVar('APPLICATION_ADAPTERS_MONGODB_PORT');
const TLS_KEYFILE = checkEnvVar('TLS_KEYFILE');
const TLS_CERTFILE = checkEnvVar('TLS_CERTFILE');
const TLS_ENABLED = checkEnvVar('TLS_ENABLED');

if (TLS_ENABLED == 'true') {
  https.createServer({
    key: fs.readFileSync(TLS_KEYFILE),
    cert: fs.readFileSync(TLS_CERTFILE)
  }, router).listen(PORT, () => {
    logger.info(`A Server is running https://localhost:${PORT}...`);
    router.emit('app_started');
  });
} else {
  http.createServer(router).listen(PORT, () => {
    logger.info(`A Server is running http://localhost:${PORT}...`);
    router.emit('app_started');
  });
}

export { router as app };

function checkEnvVar(variableName: string): string {
  let retVal: string | undefined = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      'A variable that is required by the service has not been defined in the environment:' +
        variableName
    );
  }
}
