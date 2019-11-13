import { Request, Response, NextFunction } from "express";
import { Frame } from "i40-aas-objects";
import {
  readAdapterBySubmodelId,
  register,
  clearAllEntries
} from "./registry-api";
import { IdTypeEnum } from "i40-aas-objects";
import * as logger from "winston";
import {
  HTTP404Error,
  HTTP401Error,
  HTTP422Error
} from "../../utils/httpErrors";
import { IRegisterAdapterAssignment } from "./interfaces/IAPIRequests";

export default [
  {
    path: "/register",
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
          logger.debug(" initiate register of " + aas.adapter.adapterId);

          await register(aas);
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
          if (!req.query.submodelidshort) {
            next(new HTTP422Error("No Submodel IdShort parameter given"));
          }
          var submodelId: string = req.query.submodelidshort;
          logger.debug(" Submodel id : " + submodelId);

          let adaptersArray = await readAdapterBySubmodelId(submodelId);
          logger.debug(
            " Adapter that was found " + JSON.stringify(adaptersArray)
          );

          res.json(adaptersArray);
        } catch (e) {
          console.log(e);
          next(Error(" Internal Server Error"));
        }
      }
    ]
  },

  {
    path: "/clear",
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
