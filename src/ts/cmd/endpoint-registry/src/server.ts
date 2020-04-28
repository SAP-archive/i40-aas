import http from 'http';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import healthRoute from './services/health/routes';
import errorHandlers from "./middleware/errorHandlers";

import routes from './services';
import middleware from './middleware';
import 'reflect-metadata';
import { RegistryFactory } from './services/registry/daos/postgres/RegistryFactory';


const logger = require('aas-logger/lib/log');

const router = express();
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);
applyMiddleware(errorHandlers, router);

const PORT = 4400;
const server = http.createServer(router);

server.listen(PORT, () =>
logger.info(`A Server is running http://localhost:${PORT}...`)
);

export { router as app };
