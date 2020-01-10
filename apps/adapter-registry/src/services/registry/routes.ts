import { Request, Response, NextFunction } from "express";
import { Frame } from "i40-aas-objects";
import {
  clearAllEntries,
  getAdapterBysubmodelSemanticId,
  getAdapterBySubmodelId,
  createAdapters
} from "./registry-api";
import { IdTypeEnum } from "i40-aas-objects";
import * as logger from "winston";
import {
  HTTP404Error,
  HTTP401Error,
  HTTP422Error
} from "../../utils/httpErrors";
import { create } from "domain";
import { ICreateAdapter } from "./interfaces/IAPIRequests";
import {
  checkReqBodyEmpty,
  validateCreateAdaptersRequest
} from "../../middleware/checks";
import { runInNewContext } from "vm";
import { Adapter } from "./interfaces/IRegistryResultSet";

export default [
  {
    path: "/adapters",
    method: "post",
    handler: [
      checkReqBodyEmpty,
      validateCreateAdaptersRequest,
      async (req: Request, res: Response, next: NextFunction) => {
  var adaptersAssignmentArray: ICreateAdapter[] = req.body;
  logger.info(
    " Register request received num of adapters " +
      adaptersAssignmentArray.length
  );

  try {
    let result = await createAdapters(adaptersAssignmentArray);
    logger.debug("result "+ JSON.stringify(result));
    res.status(200).send(result);

  } catch (e) {
    logger.error(" Error while registering adapter " + e);
    next(new Error(" Server Error "));
  }
      }
    ]
  },

  {
    path: "/adapters",
    method: "get",
    handler: [
      async (req: Request, res: Response, next: NextFunction) => {
        try {
    var submodelid = req.query.submodelid;
    var submodelsemanticid = req.query.submodelsemanticid;

    if (submodelid) {
            logger.debug("Submodel id : " + submodelid);
            let adaptersArray = await getAdapterBySubmodelId(submodelid);
            res.json(adaptersArray);
          } else if (submodelsemanticid) {
            logger.debug("Submodel id : " + submodelsemanticid);
            let adaptersArray = await getAdapterBysubmodelSemanticId(
              submodelsemanticid
            );
            res.json(adaptersArray);
          } else {
            next(new HTTP422Error("No parameter given at request"));
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
    handler: [
      checkReqBodyEmpty,
      validateCreateAdaptersRequest,

      async (req: Request, res: Response) => {
  var adaptersAssignmentArray: ICreateAdapter[] = req.body;
  logger.info(" Clear all registry entries ");

  try {
    await clearAllEntries();
  } catch (e) {
    logger.error(" Error while clearing registry " + e);

    res.end(e.message);
  }

  res.json("Registry Cleared");
      }
    ]
  }
];
