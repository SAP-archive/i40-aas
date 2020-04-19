import { Request, Response, NextFunction } from "express";
import { HTTP400Error, HTTP422Error, HTTP404Error } from "../utils/httpErrors";
import { Submodel } from "i40-aas-objects";
import { logger } from "../utils/log";

export const checkReqBodyEmpty = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //check if the req body is empty
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    throw new HTTP400Error("Submodel JSON is empty, check request body!");
  }
  else {
    next();
  }
};
/**
 * Validation function to check that the submodels request contains valid
 * submodels elements
 * @param req
 * @param next
 */
export const validateSubmodelsRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let submodelsArray: Submodel[]| undefined = req.body;
  if (submodelsArray && submodelsArray.length > 0) {
    submodelsArray.forEach(submodel => {
      //based on this id the routing towards the storage adapter takes place
        let submodelID:string = submodel.idShort;
        logger.debug("id " + submodelID);
    if(!submodelID) {
        logger.error("Missing id in submodel "+submodel.identification.id);
        throw new HTTP422Error("Missing required fields in Request: idShort");

      }

});
//all clear move to next
next();
}
else {
  throw new HTTP404Error("Client Error on submodels request")
}
}
