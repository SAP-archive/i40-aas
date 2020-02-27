import { Request, Response } from 'express';
import {
  register,
  createRole,
  createSemanticProtocol,
  assignRolesToAAS,
  getAllEndpointsList,
  deleteRecordByIdentifier,
  createAsset,
  getEndpointsByReceiverRole,
  getEndpointsByReceiverId
} from './registry-api';
import { IdTypeEnum } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
import {
  ICreateRole,
  IAssignRoles,
  IRegisterAas,
  ICreateAsset
} from './daos/interfaces/IApiRequests';
import {
  Role,
  ConversationMember
} from 'i40-aas-objects/dist/src/interaction/ConversationMember';
import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';
export default [
  {
    path: '/assetadministrationshells',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('try to register sth.');
      var endpointsAssignmentArray: IRegisterAas[] = req.body;

      //TODO: revise the array endpoints, the for loop should go to registry-api
      endpointsAssignmentArray.forEach(async aas => {
        try {
          await register(aas);
        } catch (e) {
          res.end(e.message);
        }
      });
      res.json(req.body);
    }
  },
  {
    path: '/roles',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('try to create a role');
      var rolesArray: ICreateRole[] = req.body;
      rolesArray.forEach(async role => {
        try {
          await createRole(role);
        } catch (e) {
          res.end(e.message);
        }
      });
      res.json(req.body);
    }
  },
  {
    path: '/roleassignment',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('try to create a role assignment to AAS');
      var assignmentArray: IAssignRoles[] = req.body;
      assignmentArray.forEach(async assignment => {
        try {
          res.json(await assignRolesToAAS(assignment));
        } catch (e) {
          res.end(e.message);
        }
      });
      res.json(req.body);
    }
  },
  {
    path: '/semanticprotocol',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('try to create a semantic protocol');
      try {
        res.json(await createSemanticProtocol(req.body));
      } catch (e) {
        res.end(e.message);
      }
    }
  },
  {
    path: '/asset',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('try to create a asset');
      try {
        var asset: ICreateAsset = req.body;
        res.json(await createAsset(asset));
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
          idType = <IdTypeEnum>[][req.query.idType];
        }
        res.json(
          await deleteRecordByIdentifier({ id: req.query.id, idType: idType })
        );
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    //throw new RegistryError('Missing parameter receiver', 422);
    path: '/assetadministrationshells',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      try {
        console.log('Query parameters received:' + JSON.stringify(req.query));
        if (req.query.receiverId && req.query.receiverIdType) {
          res.json(
            await getEndpointsByReceiverId(
              req.query.receiverId,
              req.query.receiverIdType
            )
          );
        }
        if (req.query.receiverRole && req.query.semanticProtocol) {
          res.json(
            await getEndpointsByReceiverRole(
              req.query.receiverRole,
              req.query.semanticProtocol
            )
          );
        }
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
        res.json(await getAllEndpointsList());
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  }
];
