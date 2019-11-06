import express from "express";
import { applyMiddleware, applyRoutes } from "./utils";
import middleware from "./middleware";
import errorHandlers from "./middleware/errorHandlers";
import { AmqpClient } from "./services/aas-router/messaging/AMQPClient";

import { initiateBroker } from "./services/aas-router/RoutingController";

//init logger
import { logger } from "./utils/log";
import routes from "./services";

const dotenv = require("dotenv");
dotenv.config();

let BROKER_URL = process.env.AMQP_URL;
var BROKER_EXCHANGE = process.env.BROKER_EXCHANGE;
var BROKER_USER = process.env.BROKER_USER;
var BROKER_PASSWORD = process.env.BROKER_PASSWORD;

if (BROKER_URL) {
  logger.info("[AMQP]" + " AMQP_URL from env is: " + BROKER_URL);
} else {
  logger.info(
    "[AMQP]" + " AMQP_URL not found will try to connect to: " + BROKER_URL
  );
}

if (BROKER_EXCHANGE) {
  logger.info("[AMQP]" + " Exchange name from env is: " + BROKER_EXCHANGE);
} else {
  logger.error(
    "[AMQP]" +
      " Exchange name not found will try to connect to: " +
      BROKER_EXCHANGE
  );
}
if (BROKER_USER) {
  logger.info("[AMQP]" + " Broker  username loaded from env");
} else {
  logger.error(
    "[AMQP]" +
      " Username env variable was not found will try to connect to: " +
      BROKER_USER
  );
}
if (BROKER_PASSWORD) {
  logger.info("[AMQP]" + " Broker password loaded from env ");
} else {
  logger.error(
    "[AMQP]" +
      " Broker password not found will try to connect with user default pass"
  );
}
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

applyMiddleware(middleware, router);
applyRoutes(routes, router);
//error handling
applyMiddleware(errorHandlers, router);

if (BROKER_URL && BROKER_EXCHANGE && BROKER_USER && BROKER_PASSWORD) {
  let brokerClient = new AmqpClient(
    BROKER_URL,
    BROKER_EXCHANGE,
    BROKER_USER,
    BROKER_PASSWORD
  );

  initiateBroker(brokerClient);
}
/**
 * start the broker client and connect
 *  */

const { PORT = 2000 } = process.env;

router.listen(PORT, () => {
  logger.info(`A Server is running http://localhost:${PORT}...`);
  router.emit("app_started");
});

export { router as app };
