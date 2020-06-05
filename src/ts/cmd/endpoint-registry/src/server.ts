import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import healthRoute from './services/health/routes';
import errorHandlers from "./middleware/errorHandlers";

import routes from './services';
import middleware from './middleware';
import 'reflect-metadata';
import { RegistryFactory } from './services/registry/daos/postgres/RegistryFactory';


const logger = require('aas-logger/lib/log');

const router = express();
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);
applyMiddleware(errorHandlers, router);

const PORT = checkEnvVar('CORE_REGISTRIES_ENDPOINTS_PORT');
const TLS_KEYFILE = checkEnvVar('TLS_KEYFILE');
const TLS_CERTFILE = checkEnvVar('TLS_CERTFILE');
const TLS_ENABLED = checkEnvVar('TLS_ENABLED');

if (TLS_ENABLED == 'true') {
  https.createServer({
    key: fs.readFileSync(TLS_KEYFILE),
    cert: fs.readFileSync(TLS_CERTFILE)
  }, router).listen(PORT, () => {
    logger.info(`A Server is running http://localhost:${PORT}...`);
  });
} else {
  http.createServer(router).listen(PORT, () =>
    logger.info(`A Server is running http://localhost:${PORT}...`)
  );
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
