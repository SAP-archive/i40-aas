import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import middleware from './middleware';
import errorHandlers from './middleware/errorHandlers';
import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';

import { initiateBroker } from './services/aas-router/RoutingController';

//init logger
import { logger } from './utils/log';
import healthRoute from './services/health/routes';
import routes from './services';
import { uuid } from 'uuidv4';

const dotenv = require('dotenv');
dotenv.config();

let CORE_BROKER_HOST = process.env.CORE_BROKER_HOST;
let CORE_BROKER_PORT = process.env.CORE_BROKER_PORT;
var CORE_INGRESS_EXCHANGE = process.env.CORE_INGRESS_EXCHANGE;
var CORE_INGRESS_USER = process.env.CORE_INGRESS_USER;
var CORE_INGRESS_PASSWORD = process.env.CORE_INGRESS_PASSWORD;

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

if (
  CORE_BROKER_HOST &&
  CORE_BROKER_PORT &&
  CORE_INGRESS_EXCHANGE &&
  CORE_INGRESS_USER &&
  CORE_INGRESS_PASSWORD &&
  BROKER_QUEUE
) {
  let brokerClient = new AmqpClient(
    CORE_BROKER_HOST,
    CORE_BROKER_PORT,
    CORE_INGRESS_EXCHANGE,
    CORE_INGRESS_USER,
    CORE_INGRESS_PASSWORD,
    BROKER_QUEUE
  );

  initiateBroker(brokerClient);
}
/**
 * start the broker client and connect
 *  */

const PORT = process.env.CORE_INGRESS_HTTP_PORT;

router.listen(PORT, () => {
  logger.info(`A Server is running http://localhost:${PORT}...`);
  router.emit('app_started');
});

export { router as app };
