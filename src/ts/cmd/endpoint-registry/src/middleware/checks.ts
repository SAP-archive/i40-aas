import { Request, Response, NextFunction } from "express";
import { HTTP400Error, HTTP422Error, HTTP404Error } from "../utils/httpErrors";
import { Submodel } from "i40-aas-objects";
import { logger } from "../utils/log";
import { IAASDescriptor } from "../services/registry/daos/interfaces/IAASDescriptor";
import { AASDescriptorResponse } from "../services/registry/daos/responses/AASDescriptorResponse";
import { IEndpoint } from "../services/registry/daos/interfaces/IEndpoint";

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
 * Validation function to check that the AASDescriptor request contains valid
 *  elements
 * @param req
 * @param next
 */
export const validateAASDescriptorRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let AASDescriptor: IAASDescriptor| undefined = req.body;
  if (AASDescriptor) {

      //based on this id the routing towards the storage adapter takes place
        let aasId:string = AASDescriptor.identification.id;
        let endpoints: IEndpoint[] = AASDescriptor.descriptor.endpoints;
        let assetId:string = AASDescriptor.asset.id;
    if(!aasId || !endpoints || !assetId) {
        logger.error("Missing element(s) in request ");
        throw new HTTP422Error("Missing required fields in Request: idShort");

      }

//all clear move to next
next();
}
else {
  throw new HTTP422Error("Client Error on submodels request")
}
}
