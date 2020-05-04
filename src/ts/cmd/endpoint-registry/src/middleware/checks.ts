import { Request, Response, NextFunction } from "express";
import { HTTP400Error, HTTP422Error, HTTP404Error } from "../utils/httpErrors";
const logger = require('aas-logger/lib/log');
import { IAASDescriptor } from "../services/registry/daos/interfaces/IAASDescriptor";
import { IEndpoint } from "../services/registry/daos/interfaces/IEndpoint";
import { ISemanticProtocol } from "../services/registry/daos/interfaces/ISemanticProtocol";
import { IRole } from "../services/registry/daos/interfaces/IRole";

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
/**
 * Validation function to check that the SemanticProtocol request contains valid
 *  elements
 * @param req
 * @param next
 */
export const validateSemanticProtocolRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let semProtocol: ISemanticProtocol| undefined = req.body;
  if (semProtocol) {

      //based on this id the routing towards the storage adapter takes place
        let protocolId:string = semProtocol.identification.id;
        let roles: IRole[] = semProtocol.roles;
        if(!protocolId || !roles ) {
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
