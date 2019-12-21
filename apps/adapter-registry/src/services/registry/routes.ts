import { Request, Response, NextFunction } from "express";
import { Frame } from "i40-aas-objects";
import {
  clearAllEntries,
  getAdapterBysubmodelSemanticId,
  getAdapterBySubmodelId,
  createAdapter
} from "./registry-api";
import { IdTypeEnum } from "i40-aas-objects";
import * as logger from "winston";
import {
  HTTP404Error,
  HTTP401Error,
  HTTP422Error
} from "../../utils/httpErrors";
import { IRegisterAdapterAssignment } from "./interfaces/IAPIRequests";
import { create } from "domain";

export default [
  {
    path: "/adapters",
    method: "post",
    handler: async (req: Request, res: Response) => {
      var adaptersAssignmentArray: IRegisterAdapterAssignment[] = req.body;
      logger.info(
        " Register request received num of adapters " +
          adaptersAssignmentArray.length
      );
      //store each adapter to registry
      adaptersAssignmentArray.forEach(async aas => {
        try {
          logger.debug(
            " registering of the adapter with ID: " + aas.adapter.adapterId
          );

          await createAdapter(aas);
        } catch (e) {
          logger.error(" Error while registering adapter " + e);

          res.end(e.message);
        }
      });
      res.json(req.body);
    }
  },

  {
    path: "/adapters",
    method: "get",
    handler: [
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          logger.debug(" Requested to list adapters by submodelid");
          if (req.query.submodelid) { 
            var submodelId: string = req.query.submodelid;
            logger.debug("Submodel id : " + submodelId);
            let adaptersArray = await getAdapterBySubmodelId(submodelId);
            res.json(adaptersArray);
          }
          else if(req.query.submodelSemanticId){
            var submodelSemanticId: string = req.query.submodelSemanticId;
            logger.debug("Submodel id : " + submodelSemanticId);
            let adaptersArray = await getAdapterBysubmodelSemanticId(submodelSemanticId);
            res.json(adaptersArray);
          }
          else{
            next(new HTTP422Error("No parameter given at request"))
          }
         

        } catch (e) {
          console.log(e);
          next(Error(" Internal Server Error"));
        }
      }
    ]
  },

  {
    path: "/adapters",
    method: "delete",
    handler: async (req: Request, res: Response) => {
      var adaptersAssignmentArray: IRegisterAdapterAssignment[] = req.body;
      logger.info(" Clear all registry entries ");

      try {
        await clearAllEntries();
      } catch (e) {
        logger.error(" Error while clearing registry " + e);

        res.end(e.message);
      }

      res.json("Registry Cleared");
    }
  }
];
