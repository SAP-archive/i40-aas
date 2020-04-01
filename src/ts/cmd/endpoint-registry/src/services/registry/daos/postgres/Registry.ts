import { iRegistry } from '../interfaces/IRegistry';
import {
  IRegistryResultSet,
  RegistryResultSet
} from '../interfaces/IRegistryResultSet';
import { IdTypeEnum } from 'i40-aas-objects';
import { IIdentifier } from 'i40-aas-objects';
import { RegistryError } from '../../../../utils/RegistryError';
import { IData } from '../../../../utils/IData';
import { IJointRecord, IEndpointRecord } from '../interfaces/IQueryResults';
import {
  IAASDescriptor,
  IAssignRoles,
  ICreateRole,
  ICreateSemanticProtocol,
  ICreateAsset
} from '../interfaces/IApiRequests';
import {
  RegistryRolesResultSet,
  ICreateRoleResultSet
} from '../interfaces/IRegistryRolesSet';
import { Asset } from '../Entities/AssetEntity';
import { Connection, createConnection } from 'typeorm';
import { Endpoint } from '../Entities/EndpointEntity';
import { AASDescriptor } from '../Entities/AASDescriptorEntity';
import { AASDescriptorResponse } from '../Responses/AASDescriptorResponse';

class Registry implements iRegistry {
  constructor(private readonly client: Connection) {
    //https://node-postgres.com/
    //this.db = db;
  }
  release() {
    // if (this.client && this.client.release) {
    //   this.client.release();
    // }
  }

  async createAsset(asset: ICreateAsset): Promise<ICreateAsset> {
    try {
      const insertAssetResult = await this.client.query(
        ' INSERT INTO public.assets( "assetId", "idType") VALUES ($1, $2);',
        [asset.assetId.id, asset.assetId.idType]
      );
      return asset;
    } catch (e) {
      //TODO: all error messages should be converted to user readable messages in this class
      if (e.code == 23505) {
        console.log('Asset already exist');
        throw new Error('Asset already exist');
      } else {
        throw e;
      }
    }
  }

  async registerAas(record: IAASDescriptor): Promise<void> {
    //TODO: remove cast once migration complete

    try {
      //create Asset associated with this AAS
      // have seperate handlers for each entity and report errors e.g. when assetid present
      let asset = new Asset();
      asset.id = record.asset.id;
      asset.idType = record.asset.idType;

      let savedAsset = await this.client.manager.save(asset);
      console.log("Asset Saved in Db ", asset);
    } catch (error) { console.log(error) }

    try{     await Promise.all(
        record.descriptor.endpoints.map(async endpoint => {
          let ep = new Endpoint();
          ep.aasId = record.identification.id;
          ep.address = endpoint.address;
          ep.type = endpoint.type;
          await this.client.manager.save(ep);
          console.log("Endpoint Saved in Db ", ep);

        })
      );
      //create Endpoints for this AAS
    } catch (error) { console.log(error) }

try{
      //finally create the AASDescriptor in DB
      let aasDescriptor = new AASDescriptor();
      aasDescriptor.id = record.identification.id;
      aasDescriptor.idType = record.identification.idType;
      aasDescriptor.assetId = record.asset.id;
      aasDescriptor.ertificate_x509_i40 = record.descriptor.certificate_x509_i40;
      aasDescriptor.signature = record.descriptor.signature;
      await this.client.manager.save(aasDescriptor);
      console.log("AASDescriptor Saved in Db ", aasDescriptor);


    } catch (error) { console.log(error) }



    /*
        //TODO: remove cast once migration complete
        try {
          await this.client.query('BEGIN');
          //TODO: if error handling change, we can use createAsset here
          const insertAssetResult = await this.client.query(
            ' INSERT INTO public.assets( "assetId", "idType") VALUES ($1, $2) ON CONFLICT DO NOTHING;',
            [record.assetId.id, record.assetId.idType]
          );
          const insertAasResult = await this.client.query(
            'INSERT INTO public.asset_administration_shells("aasId", "idType", "assetId") VALUES ($1, $2, $3);',
            [record.aasId.id, record.aasId.idType, record.assetId.id]
          );
          const deleteEndpointResult = await this.client.query(
            'DELETE FROM public.endpoints WHERE "aasId" = $1;',
            [record.aasId.id]
          );

          await Promise.all(
            record.endpoints.map(async (endpoint: IEndpoint) => {
              console.log('endpoint:' + JSON.stringify(endpoint));
              const insertEndpointResult = await this.client.query(
                'INSERT INTO public.endpoints( "URL", protocol_name, protocol_version, "aasId",target) VALUES ($1, $2, $3, $4, $5);',
                [
                  endpoint.url,
                  endpoint.protocol,
                  endpoint.protocolVersion,
                  record.aasId.id,
                  endpoint.target
                ]
              );
            })
          );
          await this.client.query('COMMIT');
          console.log(record);
          return record;
        } catch (error) {
          await this.client.query('ROLLBACK');
          throw error;
        }
        */
  }

  updateAas(record: IAASDescriptor): Promise<IRegistryResultSet> {
    throw new Error('Method not implemented.');
  }

  async deleteAasByAasId(aasId: IIdentifier): Promise<number> {
    //This will remove all records associated with aasId from
    //all tables due to constraints in the DB setup
    console.log(' ********* AASID ' + aasId.id);

    try {
      const deleteRowsCount = await this.client.query(
        'WITH deleted AS (DELETE FROM asset_administration_shells WHERE "aasId" = $1 RETURNING *) SELECT count(*) FROM deleted;',
        [aasId.id]
      );
      if (deleteRowsCount.rows.length < 1) {
        console.log('No entry with this aasId');

        return +deleteRowsCount.rows[0].count;
      } else {
        //TODO: parse the json to get the correct rowscount
        console.log('  Deleted rows ' + deleteRowsCount.rows.length);
        return +deleteRowsCount.rows[0].count;
      }
    } catch (e) {
      throw e;
    }
  }

  listAasByAssetId(assetId: IIdentifier): Promise<IRegistryResultSet[]> {
    throw new Error('Method not implemented.');
  }
  listAas(): Promise<IRegistryResultSet[]> {
    throw new Error('Method not implemented.');
  }

  async createSemanticProtocol(
    record: import('../interfaces/IApiRequests').ICreateSemanticProtocol
  ): Promise<ICreateSemanticProtocol> {
    try {
      const insertRolesResult = await this.client.query(
        'INSERT INTO public.semantic_protocols("protocolId") VALUES ($1);',
        [record.semanticProtocol]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log('Role already exist');
      } else {
        throw e;
      }
    }

    console.log(record);
    return record;
  }
  async assignRoles(record: IAssignRoles): Promise<RegistryRolesResultSet> {
    try {
      //create endpoint entry
      console.log(
        'aasId ' + record.aasId.id + ' with role id ' + record.roleId
      );

      const insertRolesResult = await this.client.query(
        'INSERT INTO public.aas_role("aasId","roleId")  VALUES ($1, $2);',
        [record.aasId.id, record.roleId]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log('Role Assignment already exists');
      } else {
        throw e;
      }
    }

    console.log(record);
    return record;
  }

  async createRole(record: ICreateRole): Promise<ICreateRoleResultSet> {
    try {
      const insertRolesResult = await this.client.query(
        'INSERT INTO public.roles( "roleId", "protocolId") VALUES ($1, $2);',
        [record.roleId, record.semanticProtocol]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log('Role already exist');
      } else {
        throw e;
      }
    }

    console.log(record);
    return record;
  }
  async readAASDescriptorByAasId(
    aasId: string
  ): Promise<void>{
    let aasDescriptorRepository = this.client.getRepository(AASDescriptor);

    let resultAasDescriptor = await aasDescriptorRepository.findOne({ id: aasId });

    //let response = new AASDescriptorResponse();



    }




  async readEndpointBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<Array<RegistryResultSet>> {
    /*
    try {
      var s =
        'SELECT public.assets."idType" as "assetIdType", ' +
        'public.assets."assetId",aasWithProtocols."aasId",aasWithProtocols."idType" as "aasIdType", ' +
        'aasWithProtocols."protocol_name" ,aasWithProtocols."protocol_version", aasWithProtocols."roleId",aasWithProtocols."URL",aasWithProtocols."target" ' +
        'FROM ((SELECT * FROM public.aas_role ' +
        'INNER JOIN public.asset_administration_shells ' +
        'USING ("aasId") ' +
        'WHERE "roleId" = (SELECT "roleId" FROM public.roles where ' +
        '"protocolId" = $1 and "roleId" = $2 ' +
        'limit 1)) as res ' +
        'INNER JOIN public.endpoints ' +
        'USING("aasId")) as aasWithProtocols INNER JOIN public.assets USING ("assetId") ';
      const resultOfQuery = await this.client.query(s, [sProtocol, role]);
      const queryResultRows: Array<IJointRecord> = resultOfQuery.rows;
      var recordsByAasId: IData = {};
      await Promise.all(
        queryResultRows.map(function(row: IJointRecord) {
          //TODO:is there a way to get rid of the if statement
          //using something like a collector
          //use something like node-transform
          if (!recordsByAasId[row.aasId]) {
            recordsByAasId[row.aasId] = new RegistryResultSet(
              { id: row.aasId, idType: row.aasIdType },
              [
                new Endpoint(
                  row.URL,
                  row.target,
                  row.protocol_name,
                  row.protocol_version
                )
              ],
              { id: row.assetId, idType: row.aasIdType }
            );
          } else {
            recordsByAasId[row.aasId].endpoints.push(
              new Endpoint(
                row.URL,
                row.target,
                row.protocol_name,
                row.protocol_version
              )
            );
          }
        })
      );
      var result: Array<RegistryResultSet> = [];
      Object.keys(recordsByAasId).forEach(function(key) {
        result.push(recordsByAasId[key]);
      });
      return result;
    } catch (err) {
      throw new RegistryError(err, 500);
    }
    */
    return [];
  }

  async listAllEndpoints(): Promise<Array<RegistryResultSet>> {
    /* try {
       //TODO: Nested SELECTS make it hard to read, first level only required to disambiguate idType?
       var s = `SELECT  "aasId", "aasIdType" ,"idType" as "assetIdType", "URL", "protocol_name", "protocol_version", "roleId","assetId","target" FROM (SELECT "aasId", "idType" as "aasIdType", "URL", "protocol_name", "protocol_version", "roleId","assetId", "target"
       FROM (SELECT *
           FROM public.aas_role
                     INNER JOIN public.asset_administration_shells
       USING ("aasId")
           ) as res
       INNER JOIN public.endpoints
       USING
       ("aasId"))as res2 INNER JOIN public.assets
     USING ("assetId")`;
       const resultOfQuery = await this.client.query(s);
       const queryResultRows: Array<IJointRecord> = resultOfQuery.rows;
       var recordsByAasId: IData = {};
       //TODO: better to use map here in order to avoid if statement
       //inside loop
       //use node-transform perhaps
       queryResultRows.forEach(function(row: IJointRecord) {
         if (!recordsByAasId[row.aasId]) {
           recordsByAasId[row.aasId] = new RegistryResultSet(
             { id: row.aasId, idType: row.aasIdType },
             [
               new Endpoint(
                 row.URL,
                 row.target,
                 row.protocol_name,
                 row.protocol_version
               )
             ],
             { id: row.assetId, idType: row.aasIdType }
           );
         } else {
           recordsByAasId[row.aasId].endpoints.push(
             new Endpoint(
               row.URL,
               row.target,
               row.protocol_name,
               row.protocol_version
             )
           );
         }
       });

       //TODO: this could be combined with the traversal just above
       var result: Array<RegistryResultSet> = [];
       Object.keys(recordsByAasId).forEach(function(key) {
         result.push(recordsByAasId[key]);
       });
       return result;
     } catch (err) {
       throw new RegistryError(err, 500);
     }
   }
   */
    return []
  }
}

export { Registry };
