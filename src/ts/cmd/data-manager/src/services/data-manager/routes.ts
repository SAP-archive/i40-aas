import { Request, Response, NextFunction } from 'express';
import { Submodel as submodel } from 'i40-aas-objects';
import {
  checkReqBodyEmpty,
  validateSubmodelsRequest,
} from '../../middleware/checks';

import { RoutingController } from './RoutingController';
import { HTTP400Error } from '../../utils/httpErrors';

const logger = require('aas-logger/lib/log');

export default [
  {
    path: '/submodels',
    method: 'post',
    handler: [
      checkReqBodyEmpty,
      validateSubmodelsRequest,
      async (req: Request, res: Response, next: NextFunction) => {
        /**
        * receive an array of Submodels and find the respective adapter for each submodel
        tp be forwarded
        */
        let submodelsArray: submodel[] = req.body;

        logger.info(
          'Num of submodels in the request: ' + submodelsArray.length
        );

        try {
          let result = await RoutingController.routeSubmodel(submodelsArray);

          //TODO: check if we need to send back the response of the adapter
          res.status(200).send(submodelsArray);
        } catch (err) {
          logger.error(
            ' Could not process the forwarding of submodel(s) ' + err
          );
          next(new Error(err));
        }
      },
    ],
  },
  {
    path: '/submodels',
    method: 'get',
    handler: [
      async (req: Request, res: Response, next: NextFunction) => {
        /**
        * receive an array of Submodels and find the respective adapter for each submodel
        to be forwarded
        */
        if (req.query.submodelid || req.query.semanticid) {
          let result = await RoutingController.getSubmodels({
            submodelid: req.query.submodelid as string,
            submodelsemanticid: req.query.semanticid  as string,
          });
          res.status(200).end(JSON.stringify(result.data));
        } else {
          next(new HTTP400Error('Missing query parameter'));
        }
      },
    ],
  },
];
