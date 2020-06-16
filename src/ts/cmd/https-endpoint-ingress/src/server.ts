import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';
import { applyMiddleware, applyRoutes } from './utils';
import middleware from './middleware';
import errorHandlers from './middleware/errorHandlers';
import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';

import { initiateBroker } from './services/aas-router/RoutingController';

//init logger

import healthRoute from './services/health/routes';
import routes from './services';
import { uuid } from 'uuidv4';

const logger = require('aas-logger/lib/log');

let CORE_BROKER_HOST = checkEnvVar('CORE_BROKER_HOST');
let CORE_BROKER_PORT = checkEnvVar('CORE_BROKER_PORT');
var CORE_INGRESS_EXCHANGE = checkEnvVar('CORE_INGRESS_EXCHANGE');
var CORE_INGRESS_USER = checkEnvVar('CORE_INGRESS_USER');
var CORE_INGRESS_PASSWORD = checkEnvVar('CORE_INGRESS_PASSWORD');
var TLS_KEYFILE = checkEnvVar('TLS_KEYFILE');
var TLS_CERTFILE = checkEnvVar('TLS_CERTFILE');
var TLS_ENABLED = checkEnvVar('TLS_ENABLED');

const PORT = checkEnvVar('CORE_INGRESS_HTTP_PORT');
// The queue is generated based on the binding key and is unique for the client

let BROKER_QUEUE = CORE_INGRESS_EXCHANGE + '/' + uuid(); //TODO: here also from env variable??

//avoid crashing the process when an unhandled Exception occurs
process.on('uncaughtException', (e) => {
  logger.error('uncaughtException ' + e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  logger.error('Unhandled rejection  ' + e);
  process.exit(1);
});

const router = express();

/**
 * For error handling the middleware is injected after the routes
 * when something bad has happened in the controller.
 * Or if threw an exception and wanted to catch it by the error handlers middleware
 */
applyRoutes(healthRoute, router);

applyMiddleware(middleware, router);
applyRoutes(routes, router);
//error handling
applyMiddleware(errorHandlers, router);

let brokerClient = new AmqpClient(
  CORE_BROKER_HOST,
  CORE_BROKER_PORT,
  CORE_INGRESS_EXCHANGE,
  CORE_INGRESS_USER,
  CORE_INGRESS_PASSWORD,
  BROKER_QUEUE
);

initiateBroker(brokerClient);

/**
 * start the broker client and connect
 *  */

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

export { router as app };
