import { Request, Response, NextFunction } from 'express';
import { HTTP400Error, HTTP422Error } from '../utils/httpErrors';

import { Adapter } from '../services/registry/interfaces/IRegistryResultSet';

const logger = require('aas-logger/lib/log');

export const checkReqBodyEmpty = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //check if the req body is empty
  if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
    throw new HTTP400Error('Submodel JSON is empty, check request body!');
  } else {
    next();
  }
};
/**
 * Validation function to check that the submodels request contains valid
 * submodels elements
 * @param req
 * @param next
 */
export const validateCreateAdaptersRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let adaptersArray: Adapter[] = req.body;
  adaptersArray.forEach((adapter) => {
    let adapterId = adapter.adapterid;
    let submodelId = adapter.submodelid;
    let semanticId = adapter.submodelsemanticid;
    logger.debug('id ' + adapterId);
    if (!adapterId) {
      logger.error('Missing id in adapter ');
      throw new HTTP422Error('Missing required fields in Request: adapterId');
    }
    if (!submodelId && !semanticId) {
      logger.error('Missing submodelId or SubmodelSemanticId ');
      throw new HTTP422Error('Missing submodelId or SubmodelSemanticId');
    }
  });

  next();
};
