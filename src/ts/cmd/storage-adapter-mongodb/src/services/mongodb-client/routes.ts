import { Request, Response, NextFunction } from 'express';
import { Submodel } from 'i40-aas-objects';
import boom = require('@hapi/boom');
import { IDatabaseClient } from './operations/IDatabaseClient';
import { SimpleMongoDbClient } from './operations/SimpleMongoDbClient';
import { SubmodelRepositoryService } from './operations/SubmodelRepositoryService';

const logger = require('aas-logger/lib/log');

function checkEnvVar(variableName: string): string {
  let retVal: string | undefined = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      'A variable that is required by the storage adapter has not been defined in the environment:' +
        variableName
    );
  }
}

let COLLECTION_IN_DATABASE = checkEnvVar(
  'APPLICATION_ADAPTERS_MONGODB_SUBMODELS_COLLECTION'
);
let APPLICATION_ADAPTERS_MONGODB_DATABASE_NAME = checkEnvVar(
  'APPLICATION_ADAPTERS_MONGODB_DATABASE_NAME'
);
let APPLICATION_ADAPTERS_MONGODB_DATABASE_HOST = checkEnvVar(
  'APPLICATION_ADAPTERS_MONGODB_DATABASE_HOST'
);
let APPLICATION_ADAPTERS_MONGODB_DATABASE_PORT = checkEnvVar(
  'APPLICATION_ADAPTERS_MONGODB_DATABASE_PORT'
);
let APPLICATION_ADAPTERS_MONGODB_DATABASE_USER = checkEnvVar(
  'APPLICATION_ADAPTERS_MONGODB_DATABASE_USER'
);
let APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD = checkEnvVar(
  'APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD'
);

let dbClient: IDatabaseClient = new SimpleMongoDbClient(
  COLLECTION_IN_DATABASE,
  APPLICATION_ADAPTERS_MONGODB_DATABASE_NAME,
  APPLICATION_ADAPTERS_MONGODB_DATABASE_HOST,
  APPLICATION_ADAPTERS_MONGODB_DATABASE_PORT,
  APPLICATION_ADAPTERS_MONGODB_DATABASE_USER,
  APPLICATION_ADAPTERS_MONGODB_DATABASE_PASSWORD
);
let repositoryService = new SubmodelRepositoryService(dbClient);

export default [
  {
    path: '/submodels',
    method: 'post',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        let sm: Submodel = Submodel.fromJSON(req.body);
        await repositoryService.createEquipmentAndSetInitialValues(sm);
        res.end();
      } catch (e) {
        if (!e.isBoom) {
          logger.debug(e.message);
          next(boom.badImplementation('Unexpected Error', e));
        } else {
          next(e);
        }
      }
    },
  },
  {
    path: '/submodels',
    method: 'get',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        let results = await repositoryService.getSubmodels();
        res.set('Content-Type', 'application/json').send(results);
      } catch (e) {
        if (!e.isBoom) {
          logger.debug(e.message);
          next(boom.badImplementation('Unexpected Error', e));
        } else {
          next(e);
        }
      }
    },
  },
  {
    path: '/submodels/:submodelId',
    method: 'delete',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        await repositoryService.delete(req.params['submodelId']);
        res.end();
      } catch (e) {
        if (!e.isBoom) {
          logger.debug(e.message);
          next(boom.badImplementation('Unexpected Error', e));
        } else {
          next(e);
        }
      }
    },
  },
];
