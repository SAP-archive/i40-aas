import http from "http";
import express from "express";
import { applyMiddleware, applyRoutes } from "./utils";
import healthRoute from "./services/health/routes";
import routes from "./services";
import middleware from "./middleware";
import errorHandlers from "./middleware/errorHandlers";
import { logger } from "./utils/log";


const dotenv = require('dotenv');
dotenv.config();

let ADAPTER_REG_URL = process.env.ADAPTER_REG_URL;
let ADAPTER_REG_ADMIN_USER = process.env.ADAPTER_REG_ADMIN_USER;
let ADAPTER_REG_ADMIN_PASS = process.env.ADAPTER_REG_ADMIN_PASS;

var webClient = new WebClient();

process.on("uncaughtException", e => {
  logger.error(e);
  process.exit(1);
});

process.on("unhandledRejection", e => {
  logger.error(e as string);
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

const { PORT = 4000 } = process.env;
const server = http.createServer(router);

server.listen(PORT, () =>
  logger.info(`A Server is running http://localhost:${PORT} ...`)
);


export {router as app}