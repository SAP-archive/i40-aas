import { Request, Response, NextFunction } from 'express';
import { Frame } from 'i40-aas-objects';
import { getAdaptersBySubmodelId, preloadRegistryInitialRecords} from './registry-api';
import { IdTypeEnum } from 'i40-aas-objects';
import * as logger from "winston";
import { HTTP404Error, HTTP401Error, HTTP422Error } from "../../utils/httpErrors";


export default [

  {
    path: '/adapters',
    method: 'get',
    handler: [ async (req: Request, res: Response, next: NextFunction) => {
      try {
        logger.debug(" Requested to list adapters by submodelid")
        if (!req.query.submodelidshort) {
          next(new HTTP422Error("No Submodel IdShort parameter given"));        }
        var submodelId: string = req.query.submodelidshort;
        logger.debug(" Submodel id : "+submodelId);

        let adaptersArray =await getAdaptersBySubmodelId(submodelId);
        logger.debug(" Adapter that was found "+ JSON.stringify(adaptersArray));

        res.json(adaptersArray);
      } catch (e) {
        console.log(e);
        next(new Error("No Submodel IdShort parameter given"));        

      }
    }
  ]
  }
];
