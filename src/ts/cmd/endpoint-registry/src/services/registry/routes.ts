import { Request, Response } from 'express';
import { IdTypeEnum } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import { RegistryApi } from './RegistryApi';
import { IAASDescriptor } from './daos/interfaces/IAASDescriptor';


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
    path: '/AASDescriptor',
    method: 'put',
    handler: async (req: Request, res: Response) => {
      console.log('/administrationshells POST request received');
      var registerAASRequest: IAASDescriptor = req.body;

      try {
        await registryApi.register(registerAASRequest);
      } catch (e) {
        updateResponseForConflict(e, res);
        res.end(e.message);
        return;
      }
      console.log(
        'Now sending back response of /administrationshells POST request'
      );
      res.json(req.body);
    }
  },
  {
    path: '/aasDescriptor',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      try {
        console.log('Query parameters received:' + JSON.stringify(req.query));
        if (req.query.aasId) {
          res.json(
            await registryApi.readAASDescriptorByAASId(
              req.query.aasId
            )
          );
        } else
          throw new RegistryError(
            'Mandatory query parameters: aasId is not found in request',
            422
          );
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    //TODO: Add validation that aasId==req.body.identification.id
    path: '/aasDescriptor',
    method: 'patch',
    handler: async (req: Request, res: Response) => {
      try {
        console.log('Query parameters received:' + JSON.stringify(req.query));
        if (req.query.aasId) {
          res.json(
            await registryApi.updateAASDescriptorByAASId(
              req.body
            )
          );
        } else
          throw new RegistryError(
            'Mandatory query parameters: aasId is not found in request',
            422
          );
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    //TODO: Add validation that aasId==req.body.identification.id
    path: '/aasDescriptor',
    method: 'delete',
    handler: async (req: Request, res: Response) => {
      try {
        console.log('Query parameters received:' + JSON.stringify(req.query));
        if (req.query.aasId) {
          res.json(
            await registryApi.deleteAASDescriptorByAASId(
              req.query.aasId
            )
          );
        } else
          throw new RegistryError(
            'Mandatory query parameters: aasId is not found in request',
            422
          );
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    path: '/listAllEndpoints',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      try {
        res.json(await registryApi.getAllEndpointsList());
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  }, {
    path: '/semanticProtocol',
    method: 'put',
    handler: async (req: Request, res: Response) => {
      console.log('/semanticprotocol PUT request received');
      try {
        await registryApi.createSemanticProtocol(req.body);
        console.log('Sent back response of /semanticprotocol PUT request');
        res.json(req.body);
      } catch (e) {
        res.end(e.message);
      }

    }
  }, {
    path: '/semanticProtocol/role/aasDescriptors',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      console.log('GET AASDescriptor by semanticprotocol and role name request received');
      try {
        console.log('Query parameters received:' + JSON.stringify(req.query));
        var response = await registryApi.readAASBySemanticProtocolAndRole(req.query.semanticProtocolId, req.query.roleName)
       // console.log('Sent back response of /semanticprotocol GET request');
        res.json(response);
      } catch (e) {
        res.end(e.message);
      }

    }
  },
];
