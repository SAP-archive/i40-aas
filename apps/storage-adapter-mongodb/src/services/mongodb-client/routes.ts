import { Request, Response, NextFunction } from "express";
import { Submodel, Property, SubmodelInterface } from "i40-aas-objects";
import boom = require("@hapi/boom");
import { logger } from "../../log";
import { IDatabaseClient } from "./operations/IDatabaseClient";
import { SimpleMongoDbClient } from "./operations/SimpleMongoDbClient";
import { SubmodelRepositoryService } from "./operations/SubmodelRepositoryService";

function checkEnvVar(variableName: string): string {
  let retVal: string | undefined = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      "A variable that is required by the storage adapter has not been defined in the environment:" +
        variableName
    );
  }
}

let COLLECTION_IN_DATABASE = checkEnvVar(
  "STORAGE_ADAPTER_MONGODB_SUBOMODELS_COLLECTION"
);
let MONGODB_INITDB_DATABASE = checkEnvVar(
  "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_DATABASE"
);
let MONGODB_HOST = checkEnvVar("MONGODB_HOST");
let MONGODB_PORT = checkEnvVar("MONGODB_PORT");
let MONGODB_INITDB_ROOT_USERNAME = checkEnvVar(
  "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_USER"
);
let MONGODB_INITDB_ROOT_PASSWORD = checkEnvVar(
  "STORAGE_ADAPTER_MONGODB_MONGODB_INITDB_ROOT_PASSWORD"
);

let dbClient: IDatabaseClient = new SimpleMongoDbClient(
  COLLECTION_IN_DATABASE,
  MONGODB_INITDB_DATABASE,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGODB_INITDB_ROOT_USERNAME,
  MONGODB_INITDB_ROOT_PASSWORD
);
let repositoryService = new SubmodelRepositoryService(dbClient);

export default [
  {
    path: "/submodels",
    method: "post",
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        let sm: Submodel = new Submodel(req.body);
        await repositoryService.createEquipmentAndSetInitialValues(sm);
        res.end();
      } catch (e) {
        if (!e.isBoom) {
          logger.debug(e.message);
          next(boom.badImplementation("Unexpected Error", e));
        } else {
          next(e);
        }
      }
    }
  },
  {
    path: "/submodels",
    method: "get",
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        let results = await repositoryService.getSubmodels();
        res.set("Content-Type", "application/json").send(results);
      } catch (e) {
        if (!e.isBoom) {
          logger.debug(e.message);
          next(boom.badImplementation("Unexpected Error", e));
        } else {
          next(e);
        }
      }
    }
  },
  {
    path: "/submodels/:submodelId",
    method: "delete",
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        await repositoryService.delete(req.params["submodelId"]);
        res.end();
      } catch (e) {
        if (!e.isBoom) {
          logger.debug(e.message);
          next(boom.badImplementation("Unexpected Error", e));
        } else {
          next(e);
        }
      }
    }
  }
];
