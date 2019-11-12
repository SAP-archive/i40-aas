import { Request, Response, NextFunction } from "express";
import { Submodel as submodel } from "i40-aas-objects";
import {
  checkReqBodyEmpty,
  validateSubmodelsRequest
} from "../../middleware/checks";
import boom = require("@hapi/boom");
import * as logger from "winston";
import { postSubmoduleToAdapter } from "./AdapterConnector";
import { IStorageAdapter } from "./IStorageAdapter";
import { HTTP400Error } from "../../utils/httpErrors";

export default [
  {
    path: "/submodels",
    method: "post",
    handler: [
      validateSubmodelsRequest,
      async (req: Request, res: Response, next: NextFunction) => {
        /**
         * receive an array of Submodels and find the respective adapter for each submodel
         tp be forwarded 
         */
        let submodelsArray: submodel[] | undefined;
        var storageAdapter: IStorageAdapter;

        submodelsArray = req.body;

        if (submodelsArray) {
          logger.info("Num of submodels in the request: " + submodelsArray.length);
          submodelsArray.forEach(async submodel => {
            try {
              storageAdapter = await getAdapterFromRegistry(
                submodel.idShort
              );

            let result = await postSubmoduleToAdapter(submodel, storageAdapter);
            res.status(200).send(submodel);   
          } catch (err) {
            logger.error(" Error getting adapter from registry "+err)
            next(new Error("Internal Server Error"));
          }});
        } else {
          next(new HTTP400Error("Error with request body, no Submodels found"));
        }
      }
    ]
  }
];
