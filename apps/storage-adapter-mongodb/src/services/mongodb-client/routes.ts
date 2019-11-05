import { Request, Response, NextFunction } from "express";
import { Submodel, Property, SubmodelInterface } from "i40-aas-objects";
import boom = require("boom");
import { logger } from "../../log";
import { IDatabaseClient } from "./operations/IDatabaseClient";
import { SimpleMongoDbClient } from "./operations/SimpleMongoDbClient";
import { SubmodelRepositoryService } from "./operations/SubmodelRepositoryService";

//TODO: put all these in configuration file or environment
let COLLECTION_IN_DATABASE = "storage-adapter-mongodb-submodels";

const dotenv = require('dotenv');
dotenv.config();

if (
  !process.env.MONGODB_HOST ||
  !process.env.MONGODB_PORT ||
  !process.env.MONGO_INITDB_DATABASE
) {
  throw new Error(
    "These environment variables need to be set: MONGODB_HOST, MONGODB_PORT, MONGO_INITDB_DATABASE"
  );
}

let dbClient: IDatabaseClient = new SimpleMongoDbClient(
  COLLECTION_IN_DATABASE,
  process.env.MONGO_INITDB_DATABASE,
  process.env.MONGODB_HOST,
  process.env.MONGODB_PORT,
  process.env.MONGO_INITDB_ROOT_USERNAME,
  process.env.MONGO_INITDB_ROOT_PASSWORD
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
