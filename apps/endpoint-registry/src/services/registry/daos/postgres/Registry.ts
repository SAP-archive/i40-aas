import { iRegistry } from '../interfaces/IRegistry';
import {
  IRegistryResultSet,
  IEndpoint,
  Endpoint,
  RegistryResultSet
} from '../interfaces/IRegistryResultSet';
import { IdTypeEnum } from 'i40-aas-objects';
import { IIdentifier } from 'i40-aas-objects';
import { RegistryError } from '../../../../utils/RegistryError';
import { IData } from '../../../../utils/IData';
import { IJointRecord, IEndpointRecord } from '../interfaces/IQueryResults';
import {
  IRegisterAas,
  IAssignRoles,
  ICreateRole,
  ICreateSemanticProtocol,
  ICreateAsset
} from '../interfaces/IApiRequests';
import {
  RegistryRolesResultSet,
  ICreateRoleResultSet
} from '../interfaces/IRegistryRolesSet';

class Registry implements iRegistry {
  constructor(private readonly client: any) {
    //https://node-postgres.com/
    //this.db = db;
  }
  release() {
    if (this.client && this.client.release) {
      this.client.release();
    }
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

  //TODO: error handling in case of already existing
  async registerAas(record: IRegisterAas): Promise<IRegistryResultSet> {
    //TODO: remove cast once migration complete
    try {
      await this.client.query('BEGIN');
      //TODO: if error handling change, we can use createAsset here
      const insertAssetResult = await this.client.query(
        ' INSERT INTO public.assets( "assetId", "idType") VALUES ($1, $2);',
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
  }

  updateAas(record: IRegisterAas): Promise<IRegistryResultSet> {
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
  //TODO: naming should be consistent: use same name in RegistryApi as here
  async readRecordByAasId(
    aasId: IIdentifier
  ): Promise<Array<IRegistryResultSet>> {
    try {
      console.log(aasId);
      const aasRecords = await this.client.query(
        'SELECT * FROM public.asset_administration_shells WHERE "aasId" = $1',
        [aasId.id]
      );
      if (aasRecords.rows.length > 0) {
        var aasRecord = aasRecords.rows[0];
        //TODO: do proper chaining of queries
        const endpointRecords = await this.client.query(
          'SELECT * FROM public.endpoints WHERE "aasId" = $1',
          [aasRecord.aasId]
        );
        var endpoints: Array<IEndpoint> = [];

        endpointRecords.rows.forEach((endpointRecord: IEndpointRecord) => {
          console.log(endpointRecord);
          var endpoint: IEndpoint = new Endpoint(
            endpointRecord.URL,
            endpointRecord.target,
            endpointRecord.protocol_name,
            endpointRecord.protocol_version
          );
          console.log(endpoint);
          endpoints.push(endpoint);
        });
        return [
          new RegistryResultSet(
            {
              id: aasRecord.aasId,
              idType: aasRecord.idType
            },
            endpoints,
            { id: '123', idType: IdTypeEnum.Custom }
          )
        ];
      } else {
        return [];
      }
    } catch (err) {
      throw new RegistryError(err, 500);
    }
  }

  async readEndpointBySemanticProtocolAndRole(
    sProtocol: string,
    role: string
  ): Promise<Array<RegistryResultSet>> {
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
  }

  async listAllEndpoints(): Promise<Array<RegistryResultSet>> {
    try {
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
}

export { Registry };
