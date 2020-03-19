import http from "http";
import express from "express";
import { applyMiddleware, applyRoutes } from "./utils";
import healthRoute from "./services/health/routes";
import routes from "./services";
import middleware from "./middleware";
import errorHandlers from "./middleware/errorHandlers";
import { logger } from "./utils/log";
import { WebClient } from "./services/data-manager/WebClient/WebClient";
import { RoutingController } from "./services/data-manager/RoutingController";
import { AdapterConnector } from "./services/data-manager/AdapterConnector";
import { AdapterRegistryConnector } from "./services/data-manager/RegistryConnector";

const dotenv = require("dotenv");
dotenv.config();

let CORE_REGISTRIES_ADAPTERS_PROTOCOL = process.env.CORE_REGISTRIES_ADAPTERS_PROTOCOL;
let CORE_REGISTRIES_ADAPTERS_HOST = process.env.CORE_REGISTRIES_ADAPTERS_HOST;
let CORE_REGISTRIES_ADAPTERS_PORT = process.env.CORE_REGISTRIES_ADAPTERS_PORT;
let CORE_REGISTRIES_ADAPTERS_USER = process.env.CORE_REGISTRIES_ADAPTERS_USER;
let CORE_REGISTRIES_ADAPTERS_PASSWORD = process.env.CORE_REGISTRIES_ADAPTERS_PASSWORD;
let CORE_REGISTRIES_ADAPTERS_URL_SUFFIX = process.env.CORE_REGISTRIES_ADAPTERS_URL_SUFFIX;
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

const PORT = 4000 ;
const server = http.createServer(router);

var webClient = new WebClient();
var buildUrl = (protocol:string,
    host:string,
    port:string,
    suffix?:string):string =>{

      return protocol+"://"+host+":"+port+suffix;
    }
if (
  CORE_REGISTRIES_ADAPTERS_PROTOCOL &&
  CORE_REGISTRIES_ADAPTERS_HOST &&
  CORE_REGISTRIES_ADAPTERS_PORT &&
  CORE_REGISTRIES_ADAPTERS_USER &&
  CORE_REGISTRIES_ADAPTERS_PASSWORD &&
  CORE_REGISTRIES_ADAPTERS_URL_SUFFIX
) {

let storageAdapterRegistryURL = new URL(buildUrl(CORE_REGISTRIES_ADAPTERS_PROTOCOL,CORE_REGISTRIES_ADAPTERS_HOST,CORE_REGISTRIES_ADAPTERS_PORT,CORE_REGISTRIES_ADAPTERS_URL_SUFFIX));

  let adapterConnector = new AdapterConnector(webClient);
  let registryConnector = new AdapterRegistryConnector(
    webClient,
    storageAdapterRegistryURL,
        CORE_REGISTRIES_ADAPTERS_USER,
    CORE_REGISTRIES_ADAPTERS_PASSWORD
  );
  RoutingController.initController(registryConnector, adapterConnector);
}
else{
  logger.error("One or more env. variable was not set. Exiting ");
  throw new Error();
}

server.listen(PORT, () =>
  logger.info(`A Server is running http://localhost:${PORT} ...`)
);

export { router as app };
