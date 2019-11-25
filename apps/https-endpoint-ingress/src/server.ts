import express from "express";
import { applyMiddleware, applyRoutes } from "./utils";
import middleware from "./middleware";
import errorHandlers from "./middleware/errorHandlers";
import { AmqpClient } from "./services/aas-router/messaging/AMQPClient";

import { initiateBroker } from "./services/aas-router/RoutingController";

//init logger
import { logger } from "./utils/log";
import healthRoute from "./services/health/routes";
import routes from "./services";

const dotenv = require("dotenv");
dotenv.config();

let RABBITMQ_AMQP_HOST = process.env.RABBITMQ_AMQP_HOST;
let RABBITMQ_AMQP_PORT = process.env.RABBITMQ_AMQP_PORT;
var RABBITMQ_BROKER_EXCHANGE = process.env.RABBITMQ_BROKER_EXCHANGE;
var RABBITMQ_BROKER_USER = process.env.RABBITMQ_BROKER_USER;
var RABBITMQ_BROKER_PASSWORD = process.env.RABBITMQ_BROKER_PASSWORD;

//avoid crashing the process when an unhandled Exception occurs
process.on("uncaughtException", e => {
  logger.error("uncaughtException " + e);
  process.exit(1);
});

process.on("unhandledRejection", e => {
  logger.error("Unhandled rejection  " + e);
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
  RABBITMQ_AMQP_HOST &&
  RABBITMQ_AMQP_PORT &&
  RABBITMQ_BROKER_EXCHANGE &&
  RABBITMQ_BROKER_USER &&
  RABBITMQ_BROKER_PASSWORD
) {
  let brokerClient = new AmqpClient(
    RABBITMQ_AMQP_HOST,
    RABBITMQ_AMQP_PORT,
    RABBITMQ_BROKER_EXCHANGE,
    RABBITMQ_BROKER_USER,
    RABBITMQ_BROKER_PASSWORD
  );

  initiateBroker(brokerClient);
}
/**
 * start the broker client and connect
 *  */


const PORT = 2000;

router.listen(PORT, () => {
  logger.info(
    `A Server is running http://localhost:${PORT}...`
  );
  router.emit("app_started");
});

export { router as app };
