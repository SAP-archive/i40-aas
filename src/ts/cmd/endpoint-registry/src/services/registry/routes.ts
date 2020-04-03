import { Request, Response } from 'express';
import { IdTypeEnum } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import {
  ICreateRole,
  IAssignRoles,
  IAASDescriptor,
  ICreateAsset
} from './daos/interfaces/IApiRequests';
import { RegistryApi } from './RegistryApi';


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
    path: '/roles',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('/roles POST request received');
      //console.log('try to create a role');
      var rolesArray: ICreateRole[] = req.body;
      console.log('Received body:' + req.body);
      console.log('Body has ' + rolesArray.length + ' elements.');
      try {
        await Promise.all(
          rolesArray.map(async role => {
            console.log('Handling role ' + role.roleId);
            await registryApi.createRole(role);
            console.log('Role ' + role.roleId + ' successfully created.');
          })
        );
      } catch (e) {
        console.log('There was an error creating roles');
        res.end(e.message);
        return;
      }
      console.log('Now sending back response of /roles POST request');
      res.json(req.body);
    }
  },
  {
    path: '/roleassignment',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('/roleassignment POST request received');
      //console.log('try to create a role assignment to AAS');
      var assignmentArray: IAssignRoles[] = req.body;
      try {
        await Promise.all(
          assignmentArray.map(async assignment => {
            await registryApi.assignRolesToAAS(assignment);
          })
        );
      } catch (e) {
        res.end(e.message);
        return;
      }
      console.log('Now sending back response of /roleassignment POST request');
      res.json(req.body);
    }
  },
  {
    path: '/semanticprotocol',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('/semanticprotocol POST request received');
      try {
        res.json(await registryApi.createSemanticProtocol(req.body));
        console.log('Sent back response of /semanticprotocol POST request');
      } catch (e) {
        res.end(e.message);
      }
    }
  },
  {
    path: '/assetadministrationshells',
    method: 'delete',
    handler: async (req: Request, res: Response) => {
      try {
        var idType: IdTypeEnum = IdTypeEnum['Custom'];
        if (req.query.idType) {
          idType = req.query.idType;
        }
        res.json(
          await registryApi.deleteRecordByIdentifier({
            id: req.query.id,
            idType: idType
          })
        );
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
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
    path: '/aasDescriptor',
    method: 'patch',
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
  // {
  //   path: '/aasDescriptorOld',
  //   method: 'get',
  //   handler: async (req: Request, res: Response) => {
  //     try {
  //       console.log('Query parameters received:' + JSON.stringify(req.query));
  //       if (req.query.receiverId && req.query.receiverIdType) {
  //         res.json(
  //           await registryApi.getEndpointsByReceiverId(
  //             req.query.receiverId,
  //             req.query.receiverIdType
  //           )
  //         );
  //       } else if (req.query.receiverRole && req.query.semanticProtocol) {
  //         res.json(
  //           await registryApi.getEndpointsByReceiverRole(
  //             req.query.receiverRole,
  //             req.query.semanticProtocol
  //           )
  //         );
  //       } else
  //         throw new RegistryError(
  //           'Mandatory query parameters: receiverId and receiverIdType, or receiverRole and semanticProtocol',
  //           422
  //         );
  //     } catch (e) {
  //       console.log(e);
  //       res.statusCode = e.r_statusCode || 500;
  //       res.end(JSON.stringify(e));
  //     }
  //   }
  // },
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
  }
];
