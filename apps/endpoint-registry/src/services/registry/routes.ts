import { Request, Response } from 'express';
import { IdTypeEnum } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import {
  ICreateRole,
  IAssignRoles,
  IRegisterAas,
  ICreateAsset
} from './daos/interfaces/IApiRequests';
import { RegistryApi } from './RegistryApi';

var registryApi = new RegistryApi();

function updateResponseForConflict(error: any, res: Response) {
  if (error.message.includes('duplicate key')) res.statusCode = 403;
}

export default [
  {
    path: '/assetadministrationshells',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('/administrationshells POST request received');
      var endpointsAssignmentArray: IRegisterAas[] = req.body;

      //TODO: revise the array endpoints, the for loop should go to RegistryApi
      await Promise.all(
        endpointsAssignmentArray.map(async aas => {
          try {
            await registryApi.register(aas);
            console.log(
              'Now sending back response of /administrationshells POST request'
            );
            res.json(req.body);
          } catch (e) {
            updateResponseForConflict(e, res);
            res.end(e.message);
          }
        })
      );
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
      await Promise.all(
        rolesArray.map(async role => {
          try {
            console.log('Handling role ' + role.roleId);
            await registryApi.createRole(role);
            console.log('Role ' + role.roleId + ' successfully created.');
            console.log('Now sending back response of /roles POST request');
            res.json(req.body);
          } catch (e) {
            console.log('There was an error creating roles');
            res.end(e.message);
          }
        })
      );
    }
  },
  {
    path: '/roleassignment',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('/roleassignment POST request received');
      //console.log('try to create a role assignment to AAS');
      var assignmentArray: IAssignRoles[] = req.body;
      await Promise.all(
        assignmentArray.map(async assignment => {
          try {
            await registryApi.assignRolesToAAS(assignment);
            console.log(
              'Now sending back response of /roleassignment POST request'
            );
            res.json(req.body);
          } catch (e) {
            res.end(e.message);
          }
        })
      );
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
    path: '/asset',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('/asset POST request received');
      try {
        //TODO: inconsistencies
        // parsing should always be done in the same place for all handlers
        //either in the handler or in RegistryApi
        //sending the response should also be done in the same way
        var asset: ICreateAsset = req.body;
        res.json(await registryApi.createAsset(asset));
        console.log('Sent back response of /asset POST request');
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
    path: '/assetadministrationshells',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      try {
        console.log('Query parameters received:' + JSON.stringify(req.query));
        if (req.query.receiverId && req.query.receiverIdType) {
          res.json(
            await registryApi.getEndpointsByReceiverId(
              req.query.receiverId,
              req.query.receiverIdType
            )
          );
        } else if (req.query.receiverRole && req.query.semanticProtocol) {
          res.json(
            await registryApi.getEndpointsByReceiverRole(
              req.query.receiverRole,
              req.query.semanticProtocol
            )
          );
        } else
          throw new RegistryError(
            'Mandatory query parameters: receiverId and receiverIdType, or receiverRole and semanticProtocol',
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
  }
];
