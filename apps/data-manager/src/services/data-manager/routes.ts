import { Request, Response, NextFunction } from "express";
import { Submodel as submodel } from "i40-aas-objects";
import {
  checkReqBodyEmpty,
  validateSubmodelsRequest
} from "../../middleware/checks";
import boom = require("@hapi/boom");
import { getAdapterFromRegistry } from "./RegistryConnector";
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
        var storageAdapterArray: IStorageAdapter[];

        submodelsArray = req.body;

        if (submodelsArray) {
          logger.info("Num of submodels in the request: " + submodelsArray.length);
          submodelsArray.forEach(async submodel => {
            try {
              storageAdapterArray = await getAdapterFromRegistry(
                submodel.idShort
              );
            
            logger.info(
              `Num of adapters for submodel ${submodel.idShort} found: ` +
                storageAdapterArray.length
            );
            //post to each adapter
            storageAdapterArray.forEach(async adapter => {
                let result = await postSubmoduleToAdapter(submodel, adapter);
                res.status(200).send(submodel);   
            });
          } catch (err) {
            next(new Error("Internal Server Error"));
          }});
        } else {
          next(new HTTP400Error("Error with request body, no Submodels found"));
        }
      }
    ]
  }
];
