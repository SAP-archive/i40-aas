import { Request, Response } from "express";
import { Frame } from "i40-aas-objects";
import {
  readRecordByIdentifier,
  register,
  readRecordBySemanticProtocolAndRole,
  getEndpointsByFrame,
  createRole,
  createSemanticProtocol,
  assignRolesToAAS,
  getAllEndpointsList,
  deleteRecordByIdentifier,
  createAsset
} from "./registry-api";
import { IdTypeEnum } from "i40-aas-objects";
import { RegistryError } from "../../utils/RegistryError";
import {
  ICreateRole,
  IAssignRoles,
  IRegisterAas,
  ICreateAsset
} from "./daos/interfaces/IApiRequests";
export default [
  {
    path: "/assetadministrationshells",
    method: "post",
    handler: async (req: Request, res: Response) => {
      console.log("try to register sth.");
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
    path: "/roles",
    method: "post",
    handler: async (req: Request, res: Response) => {
      console.log("try to create a role");
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
    path: "/roleassignment",
    method: "post",
    handler: async (req: Request, res: Response) => {
      console.log("try to create a role assignment to AAS");
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
    path: "/semanticprotocol",
    method: "post",
    handler: async (req: Request, res: Response) => {
      console.log("try to create a semantic protocol");
      try {
        res.json(await createSemanticProtocol(req.body));
      } catch (e) {
        res.end(e.message);
      }
    }
  },
  {
    path: "/asset",
    method: "post",
    handler: async (req: Request, res: Response) => {
      console.log("try to create a asset");
      try {
        var asset: ICreateAsset = req.body;
        res.json(await createAsset(asset));
      } catch (e) {
        res.end(e.message);
      }
    }
  },
  {
    path: "/assetadministrationshells",
    method: "delete",
    handler: async (req: Request, res: Response) => {
      try {
        var idType: IdTypeEnum = IdTypeEnum["Custom"];
        if (req.query.idType) {
          idType = (<any>IdTypeEnum)[req.query.idType];
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
    path: "/assetadministrationshells",
    method: "get",
    handler: async (req: Request, res: Response) => {
      try {
        if (!req.query.frame) {
          throw new RegistryError("Missing parameter frame", 422);
        }
        var frame: Frame = JSON.parse(req.query.frame);
        res.json(await getEndpointsByFrame(frame));
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    path: "/listAllEndpoints",
    method: "get",
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
