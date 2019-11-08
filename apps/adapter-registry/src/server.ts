import http from 'http';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import routes from './services';
import healthRoute from './services/health/routes';
import middleware from './middleware';
//init logger
import { logger } from "./utils/log";
import { preloadRegistryInitialRecords } from './services/registry/registry-api';


const router = express();
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);

//avoid crashing the process when an unhandled Exception occurs
process.on("uncaughtException", e => {
    logger.error("uncaughtException " +e);
    process.exit(1);
  });
  
  process.on("unhandledRejection", e => {
    logger.error("Unhandled rejection  " +e);
    process.exit(1);
  });


const { PORT = 4500 } = process.env;
const server = http.createServer(router);

server.listen(PORT, () => logger.info(`A St. Adapter Registry Service is running http://localhost:${PORT}...`));


(async () => {
  try {
      var initEntries = await  preloadRegistryInitialRecords();
      logger.debug(" Initial records loaded into storage "+ JSON.stringify(initEntries)); 

  } catch (e) {
    logger.error("Registry init was not executed");
  }
})();


