import http from 'http';
import https from 'https';
import fs from 'fs';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import healthRoute from './services/health/routes';
import routes from './services';
import middleware from './middleware';
import errorHandlers from './middleware/errorHandlers';
import { WebClient } from './services/data-manager/WebClient/WebClient';
import { RoutingController } from './services/data-manager/RoutingController';
import { AdapterConnector } from './services/data-manager/AdapterConnector';
import { AdapterRegistryConnector } from './services/data-manager/RegistryConnector';

const logger = require('aas-logger/lib/log');

const PORT = checkEnvVar('CORE_DATA_MANAGER_PORT');
const TLS_KEYFILE = checkEnvVar('TLS_KEYFILE');
const TLS_CERTFILE = checkEnvVar('TLS_CERTFILE');
const TLS_ENABLED = checkEnvVar('TLS_ENABLED');

const CORE_REGISTRIES_ADAPTERS_HOST = checkEnvVar('CORE_REGISTRIES_ADAPTERS_HOST');
const CORE_REGISTRIES_ADAPTERS_PORT = checkEnvVar('CORE_REGISTRIES_ADAPTERS_PORT');
const CORE_REGISTRIES_ADAPTERS_USER = checkEnvVar('CORE_REGISTRIES_ADAPTERS_USER');
const CORE_REGISTRIES_ADAPTERS_PASSWORD = checkEnvVar('CORE_REGISTRIES_ADAPTERS_PASSWORD');
const CORE_REGISTRIES_ADAPTERS_URL_SUFFIX = checkEnvVar('CORE_REGISTRIES_ADAPTERS_URL_SUFFIX');

let CORE_REGISTRIES_ADAPTERS_PROTOCOL = checkEnvVar('TLS_ENABLED');
if (CORE_REGISTRIES_ADAPTERS_PROTOCOL == 'true') {
  CORE_REGISTRIES_ADAPTERS_PROTOCOL = 'https';
} else {
  CORE_REGISTRIES_ADAPTERS_PROTOCOL = 'http'
}

process.on('uncaughtException', (e) => {
  logger.error('Uncaught Exception ' + e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  logger.error(('Unhandled Rejection' + e) as string);
  process.exit(1);
});

const router = express();

/**
 * For error handling the middleware is injected after the routsés
 * when something bad has happened in the controller.
 * Or if threw an exception and wanted to catch it by the error handlers middleware
 */
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);
//error handling
applyMiddleware(errorHandlers, router);

var webClient: WebClient;

if ( TLS_ENABLED == 'true' ) {
  webClient = new WebClient(fs.readFileSync(TLS_CERTFILE, "utf8"));
} else {
  webClient = new WebClient();
}

var buildUrl = (
  protocol: string,
  host: string,
  port: string,
  suffix?: string
): string => {
  return protocol + '://' + host + ':' + port + suffix;
};

let storageAdapterRegistryURL = new URL(
  buildUrl(
    CORE_REGISTRIES_ADAPTERS_PROTOCOL,
    CORE_REGISTRIES_ADAPTERS_HOST,
    CORE_REGISTRIES_ADAPTERS_PORT,
    CORE_REGISTRIES_ADAPTERS_URL_SUFFIX
  )
);

let adapterConnector = new AdapterConnector(webClient);
let registryConnector = new AdapterRegistryConnector(
  webClient,
  storageAdapterRegistryURL,
  CORE_REGISTRIES_ADAPTERS_USER,
  CORE_REGISTRIES_ADAPTERS_PASSWORD
);
RoutingController.initController(registryConnector, adapterConnector);


if (TLS_ENABLED == 'true') {
  https.createServer({
    key: fs.readFileSync(TLS_KEYFILE),
    cert: fs.readFileSync(TLS_CERTFILE)
  }, router).listen(PORT, () => {
    logger.info(`A Server is running https://localhost:${PORT}...`);
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
