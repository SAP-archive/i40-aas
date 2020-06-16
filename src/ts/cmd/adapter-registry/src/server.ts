import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import routes from './services';
import healthRoute from './services/health/routes';
import middleware from './middleware';
//init logger

const logger = require('aas-logger/lib/log');

const router = express();
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);

//avoid crashing the process when an unhandled Exception occurs
process.on('uncaughtException', (e) => {
  logger.error('uncaughtException ' + e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  logger.error('Unhandled rejection  ' + e);
  process.exit(1);
});

const PORT = checkEnvVar('CORE_REGISTRIES_ADAPTERS_PORT');
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
