import { Request, Response } from 'express';
import { Frame } from 'i40-aas-objects';
import { readRecordByIdentifier, register, readRecordBySemanticProtocolAndRole, getEndpointsByFrame } from './registry-api';
import { IdTypeEnum } from 'i40-aas-objects';
import { RegistryError } from '../../utils/RegistryError';
export default [
  {
    path: '/register',
    method: 'post',
    handler: async (req: Request, res: Response) => {
      console.log('try to register sth.');
      try {
        res.json(await register(req.body));
      } catch (e) {
        res.end(e.message);
      }
    }
  },
  {
    path: '/read',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      try {
        var idType: IdTypeEnum = IdTypeEnum['Custom'];
        if (req.query.idType) {
          idType = (<any>IdTypeEnum)[req.query.idType];
        }
        res.json(await readRecordByIdentifier({ id: req.query.id, idType: idType }));
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  },
  {
    path: '/endpoints',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      try {
        if (!req.query.frame) {
          throw new RegistryError('Missing parameter frame', 422);
        }
        var frame: Frame = JSON.parse(req.query.frame);
        res.json(await getEndpointsByFrame(frame));
      } catch (e) {
        console.log(e);
        res.statusCode = e.r_statusCode || 500;
        res.end(JSON.stringify(e));
      }
    }
  }
];
