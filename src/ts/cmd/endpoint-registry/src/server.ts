import http from 'http';
import express from 'express';
import { applyMiddleware, applyRoutes } from './utils';
import healthRoute from './services/health/routes';

import routes from './services';
import middleware from './middleware';
import "reflect-metadata";
import { RegistryFactory } from './services/registry/daos/postgres/RegistryFactory';

const router = express();
applyRoutes(healthRoute, router);
applyMiddleware(middleware, router);
applyRoutes(routes, router);


const PORT = 4400;
const server = http.createServer(router);



server.listen(PORT, () => console.log(`A Server is running http://localhost:${PORT}...`));
