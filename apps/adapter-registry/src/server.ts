import http from 'http';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import routes from './services';
import healthRoute from './services/health/routes';
import middleware from './middleware';
//init logger
import { logger } from "./utils/log";
import errorHandlers from "./middleware/errorHandlers";


const router = express();
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);
//error handling
applyMiddleware(errorHandlers, router);

//avoid crashing the process when an unhandled Exception occurs
process.on("uncaughtException", e => {
    logger.error("uncaughtException " +e);
    process.exit(1);
  });
  
  process.on("unhandledRejection", e => {
    logger.error("Unhandled rejection  " +e);
    process.exit(1);
  });


const PORT = 4500 ;
const server = http.createServer(router);

server.listen(PORT, () => logger.info(`A St. Adapter Registry Service is running http://localhost:${PORT}...`));

export {router as app};


