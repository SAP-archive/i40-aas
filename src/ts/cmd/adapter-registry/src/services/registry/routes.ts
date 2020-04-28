import { Request, Response, NextFunction } from 'express';

import {
  clearAllEntries,
  getAdapterBysubmodelSemanticId,
  getAdapterBySubmodelId,
  createAdapters,
  listAllAdapters,
} from './registry-api';
import { ICreateAdapter } from './interfaces/IAPIRequests';
import {
  checkReqBodyEmpty,
  validateCreateAdaptersRequest,
} from '../../middleware/checks';

import { Adapter } from './interfaces/IRegistryResultSet';

const logger = require('aas-logger/lib/log');

export default [
  {
    path: '/adapters',
    method: 'post',
    handler: [
      checkReqBodyEmpty,
      validateCreateAdaptersRequest,
      async (req: Request, res: Response, next: NextFunction) => {
        var adaptersAssignmentArray: ICreateAdapter[] = req.body;
        logger.info(
          ' Register request received num of adapters ' +
            adaptersAssignmentArray.length
        );

        try {
          let result = await createAdapters(adaptersAssignmentArray);
          logger.debug('result ' + JSON.stringify(result));
          res.status(200).send(result);
        } catch (e) {
          logger.error(' Error while registering adapter ' + e);
          next(new Error(' Server Error '));
        }
      },
    ],
  },

  {
    path: '/adapters',
    method: 'get',
    handler: [
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          var submodelid = req.query.submodelid;
          var submodelsemanticid = req.query.submodelsemanticid;
          if (!submodelid && !submodelsemanticid) {
            res.json(await listAllAdapters());
          } else {
            let adapter = undefined;
            logger.debug('Submodel id : ' + submodelid);
            logger.debug('Submodel semantic id : ' + submodelsemanticid);
            try {
              adapter = await getAdapterBySubmodelId(submodelid);
              res.json(adapter);
            } catch (e) {
              try {
                adapter = await getAdapterBysubmodelSemanticId(
                  submodelsemanticid
                );
                res.json(adapter);
              } catch (e) {
                next(
                  Error(
                    'no routing found for submodelid and submodelsemanticid'
                  )
                );
              }
            }
          }
        } catch (e) {
          logger.log(e);
          next(Error(' Internal Server Error'));
        }
      },
    ],
  },

  {
    path: '/listall',
    method: 'get',
    handler: [
      async (req: Request, res: Response) => {
        var adaptersList: Adapter[];
        logger.info(' List all registry entries ');

        try {
          adaptersList = await listAllAdapters();
          res.json(adaptersList);
        } catch (e) {
          logger.error(' Error while retrieving entries from registry ' + e);

          res.end(e.message);
        }
      },
    ],
  },

  {
    path: '/deleteall',
    method: 'delete',
    handler: [
      async (req: Request, res: Response) => {
        logger.info(' Clear all registry entries ');

        try {
          await clearAllEntries();
        } catch (e) {
          logger.error(' Error while clearing registry ' + e);

          res.end(e.message);
        }

        res.json('Registry Cleared');
      },
    ],
  },
];
