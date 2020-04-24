import { Request, Response, NextFunction } from 'express';
import { RegistryApi } from './RegistryApi';
import { IAASDescriptor } from './daos/interfaces/IAASDescriptor';
import { HTTP422Error } from '../../utils/httpErrors';
import { validateAASDescriptorRequest } from '../../middleware/checks';
import { ISemanticProtocol } from './daos/interfaces/ISemanticProtocol';
const logger = require('aas-logger/lib/log');


var registryApi = new RegistryApi();

function updateResponseForConflict(error: any, res: Response) {
  if (error.message.includes('duplicate key')) res.statusCode = 403;
}

//TODO: error prone error handling, not clear which statuses are sent back
//need a better way to write a status code as soon as the error occurs
//and send back any remaining exceptions as 500
//Ideally send back response in one place, not so many places
//TODO: request validation checks
export default [
  {
    path: '/admin/AASDescriptors',
    method: 'put',
    handler:[validateAASDescriptorRequest,
     async (req: Request, res: Response, next: NextFunction) => {
      logger.debug('/administrationshells PUT request received');
      var registerAASRequest: IAASDescriptor = req.body;

      try {
        await registryApi.registerOrReplace(registerAASRequest);
        res.status(200).send(req.body);
        logger.debug(
          'Now sending back response of /administrationshells PUT request'
        );
      } catch (err) {
        logger.error(' Error occurerd during processing of the request ' + err);
        next(err);
      }


    }
    ]},
  {
    path: '/AASDescriptors',
    method: 'put',
    handler:[validateAASDescriptorRequest,
      async (req: Request, res: Response, next: NextFunction) => {
      logger.debug('/administrationshells PUT request received');
      var registerAASRequest: IAASDescriptor = req.body;

      try {
        await registryApi.register(registerAASRequest);

        res.status(200).send(req.body);
        logger.debug(
          'Now sending back response of /administrationshells PUT request'
        );
      } catch (err) {
        logger.error(' Error occurerd during processing of the request ' + err);
        next(err);
      }


    }
    ]},
  {
    path: '/AASDescriptors/:aasId',
    method: 'get',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log('Path parameters received:' + JSON.stringify(req.params.aasId));
        if (req.params.aasId) {
          res.json(
            await registryApi.readAASDescriptorByAASId(
              req.params.aasId
            )
          );
        } else
          throw new HTTP422Error(
            'Mandatory path parameters: aasId is not found in request');
      } catch (err) {
        logger.error(err);
        next(err);

      }
    }
  },
  {
    path: '/AASDescriptors/:aasId',
    method: 'patch',
    handler:[validateAASDescriptorRequest,
      async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log('Path parameters received:' + JSON.stringify(req.params));
        if (req.params.aasId && req.params.aasId === req.body.identification.id ) {
          res.json(
            await registryApi.updateAASDescriptorByAASId(
              req.body
            )
          );
        } else
          throw new HTTP422Error(
            'Mandatory path parameters: aasId is not found in request'
          );
      } catch (err) {
        logger.error(err);
        next(err);
      }
    }
    ]},
  {
    //TODO: Add validation that aasId==req.body.identification.id
    path: '/AASDescriptors/:aasId',
    method: 'delete',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log('Path parameters received:' + JSON.stringify(req.params));
        if (req.params.aasId) {
          res.json(
            await registryApi.deleteAASDescriptorByAASId(
              req.params.aasId
            )
          );
        } else
          throw new HTTP422Error(
            'Mandatory path parameters: aasId is not found in request'          );
      } catch (err) {
        logger.error(err);
        next(err);
      }
    }
  },
  {
    path: '/listAllEndpoints',
    method: 'get',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      try {
        res.json(await registryApi.getAllEndpointsList());
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    path: '/semanticProtocols',
    method: 'put',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      console.log('/semanticprotocol PUT request received');
      try {
        await registryApi.createSemanticProtocol(req.body);
        console.log('Sent back response of /semanticprotocol PUT request');
        res.json(req.body);
      } catch (err) {
        logger.error(err);
        next(err);
      }

    }
  },
  {
    path: '/semanticProtocols',
    method: 'get',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      console.log('/semanticprotocol GET request received');
      try {
       let response: ISemanticProtocol[] = await registryApi.readAllSemanticProtocols();
        console.log('Sent back response of /semanticprotocol PUT request');
        res.json(response);
      } catch (err) {
        logger.error(err);
        next(err);
      }

    }
  },
   {
    path: '/semanticProtocols/:sematicProtocolId',
    method: 'delete',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      console.log('/semanticprotocol DELETE request received');

      try {
        console.log('Path parameters received:' + JSON.stringify(req.params));
        if (req.params.sematicProtocolId) {
          res.json(
            await registryApi.deleteSemanticProtocol(
              req.params.sematicProtocolId
            )
          );
        } else
          throw new HTTP422Error(
            'Mandatory path parameters: sematicProtocolId is not found in request'          );
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }

    }
  },
  {
    path: '/semanticProtocols/:semanticProtocolId/role/:roleName/AASDescriptors',
    method: 'get',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      console.log('GET AASDescriptor by semanticprotocol and role name request received');
      try {
        console.log('Path parameters received:' + JSON.stringify(req.params));
        var response = await registryApi.readAASBySemanticProtocolAndRole(req.params.semanticProtocolId, req.params.roleName)
       // console.log('Sent back response of /semanticprotocol GET request');
        res.json(response);
      } catch (e) {
        res.end(e.message);
      }

    }
  },
  {
    path: '/semanticProtocols/:semanticProtocolId',
    method: 'get',
    handler: async (req: Request, res: Response, next: NextFunction) => {
      console.log('GET SemanticProtocol by semanticprotocol request received');
      try {
        console.log('Path parameters received:' + JSON.stringify(req.params));
        var response = await registryApi.readSemanticProtocolBySemanticProtocolId(req.params.semanticProtocolId)
       // console.log('Sent back response of /semanticprotocol GET request');
        res.json(response);
      } catch (e) {
        res.end(e.message);
      }

    }
  }
];
