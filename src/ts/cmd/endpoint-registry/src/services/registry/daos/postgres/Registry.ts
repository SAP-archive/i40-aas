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
import { AssetEntity } from '../Entities/AssetEntity';
import { Connection, createConnection, UpdateResult } from 'typeorm';
import { EndpointEntity } from '../Entities/EndpointEntity';
import { AASDescriptorEntity } from '../Entities/AASDescriptorEntity';
import { AASDescriptorResponse } from '../Responses/AASDescriptorResponse';
import { Identifiable } from 'i40-aas-objects/dist/src/characteristics/Identifiable';
import { Identifier } from '../Responses/Identifier';
import { TIdType } from 'i40-aas-objects/src/types/IdTypeEnum';
import { GenericDescriptor } from '../Responses/GenericDescriptor';

class Registry implements iRegistry {
  readRecordByAasId(aasId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
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
      let asset = new AssetEntity();
      asset.id = record.asset.id;
      asset.idType = record.asset.idType;

      let savedAsset = await this.client.manager.save(asset);
      console.log("Asset Saved in Db ", asset);


      //finally create the AASDescriptor in DB
      let aasDescriptor = new AASDescriptorEntity();
      aasDescriptor.id = record.identification.id;
      aasDescriptor.idType = record.identification.idType;
      aasDescriptor.asset = record.asset;
      aasDescriptor.certificate_x509_i40 = record.descriptor.certificate_x509_i40;
      aasDescriptor.signature = record.descriptor.signature;
      await this.client.manager.save(aasDescriptor);
      console.log("AASDescriptor Saved in Db ", aasDescriptor);


      await Promise.all(
        record.descriptor.endpoints.map(async endpoint => {
          let ep = new EndpointEntity();
          ep.aasdescriptor = aasDescriptor; //one to many relation
          ep.address = endpoint.address;
          ep.type = endpoint.type;
          await this.client.manager.save(ep);
          console.log("Endpoint Saved in Db ", ep);

        })
      );
      //create Endpoints for this AAS

    } catch (error) { console.log(error) }

  }

  async updateAasDescriptorByAasId(record: IAASDescriptor): Promise<IAASDescriptor | undefined> {

    try {
      //This is the most efficient way in terms of performance to update entities in your database (see https://typeorm.io/#/update-query-builder )


      console.debug("cert "+record.descriptor.certificate_x509_i40);

      let aasDescriptor = await this.client
        .createQueryBuilder()
        .update(AASDescriptorEntity)
        .set({
          asset: record.asset,
          certificate_x509_i40: record.descriptor.certificate_x509_i40,
          signature: record.descriptor.signature
        })
        .where("id = :id", { id: record.identification.id })
        .execute();

      console.log("AASDescriptor updated in Db " + JSON.stringify(aasDescriptor));

      //TODO: is there a way to avoid this call (using the previous update maybe?)
      let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
      let resultAasDescriptor = await aasDescriptorRepository.findOne({
        where: [
          { id: record.identification.id },],
        relations: ["endpoints", "asset"]
      });

      //updated each Endpoint refering to this AAS
      if (resultAasDescriptor) {
        await Promise.all(
          record.descriptor.endpoints.map(async endpoint => {

            let updateResult = await this.client
              .createQueryBuilder()
              .update(EndpointEntity)
              .set({
                address: endpoint.address,
                type: endpoint.type
              })
              .where("aasdescriptor = :aasdescriptor", { aasdescriptor: record.identification.id })
              .andWhere("address = :address", { address: endpoint.address})
              .execute();

            console.log("Endpoint Upated in Db ", updateResult);

          })
        );
      }

      return record

    } catch (error) { console.log("Error caught " + error)
  return undefined}


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
  ): Promise<IAASDescriptor | undefined> {

    //get an Entityrepository for the AASDescriptor and the Asset
    let aasDescriptorRepository = this.client.getRepository(AASDescriptorEntity);
    let aasAssetRepository = this.client.getRepository(AssetEntity);

    //Load the AASDescriptor object from the DB as well as the related Objects (Endpoints, Asset)
    let resultAasDescriptor = await aasDescriptorRepository.findOne({
      where: [
        { id: aasId },],
      relations: ["endpoints", "asset"]
    });

    if (resultAasDescriptor) {
      console.debug("asset id " + JSON.stringify(resultAasDescriptor));
      let resultAsset = await aasAssetRepository.findOne({ id: resultAasDescriptor.asset.id })
      let aasDescrIdentifier = new Identifier(resultAasDescriptor.id, resultAasDescriptor.idType as TIdType);
      let descr = new GenericDescriptor(resultAasDescriptor.endpoints, resultAasDescriptor.certificate_x509_i40, resultAasDescriptor.signature);
      if (resultAsset) {
        let assetIdentifier = new Identifier(resultAsset.id, resultAsset.idType as TIdType);

        let response = new AASDescriptorResponse(aasDescrIdentifier, assetIdentifier, descr);
        return response;
      }
    }
    //if not found return undefined
    return undefined;

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
