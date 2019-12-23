import { Request, Response, NextFunction } from "express";
import { Submodel as submodel } from "i40-aas-objects";
import {
  checkReqBodyEmpty,
  validateSubmodelsRequest
} from "../../middleware/checks";
import boom = require("@hapi/boom");
import * as logger from "winston";

import { RoutingController } from "./RoutingController";
import { HTTP400Error } from "../../utils/httpErrors";
import { IStorageAdapter } from "./interfaces/IStorageAdapter";

export default [
  {
    path: "/submodels",
    method: "post",
    handler: [
      checkReqBodyEmpty,
      validateSubmodelsRequest,
      async (req: Request, res: Response, next: NextFunction) => {
        /**
        * receive an array of Submodels and find the respective adapter for each submodel
        tp be forwarded
        */
        let submodelsArray: submodel[] | undefined;

        submodelsArray = req.body;

        if (submodelsArray && submodelsArray.length > 0) {
          logger.info(
                    "Num of submodels in the request: " + submodelsArray.length
          );
          submodelsArray.forEach(async submodel => {
                    try {
                    let result = await RoutingController.routeSubmodel(submodel);
                    res.status(200).send(submodel);
                    } catch (err) {
                    logger.error(
                    " Could not process the forwarding of submodel " + err
                    );
                    next(new Error(" Server Error "));
                    }
                    //TODO: check if we need to send back the response of the adapter
          });
        } else {
          next(new HTTP400Error("Error with request body, no Submodels found"));
        }
      }
    ]
  },
  {
    path: "/submodels",
    method: "get",
    handler: [
      async (req: Request, res: Response, next: NextFunction) => {
        /**
         * receive an array of Submodels and find the respective adapter for each submodel
         to be forwarded
         */
	if (req.query.id) {
	  let result = await RoutingController.getSubmodels(
	    "submodelid", req.query.id
	  );
	  res.status(200).end(JSON.stringify(result.data));
	}
	 else if(req.query.semanticId) {
	  let result = await RoutingController.getSubmodels(
	    "semanticId", req.query.semanticId
	  );
          res.status(200).end(JSON.stringify(result.data));

	}
	else{
	  next(new HTTP400Error("Missing query parameter"));

        }
      }
    ]
  }
];
