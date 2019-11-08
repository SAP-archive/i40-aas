import { iRegistry } from "../interfaces/IRegistry";
import {
  IRegistryResultSet,
  Protocols,
  IEndpoint,
  Endpoint,
  RegistryResultSet
} from "../interfaces/IRegistryResultSet";
import { IdTypeEnum } from "i40-aas-objects";
import { Identifier } from "i40-aas-objects";
import { RegistryError } from "../../../../utils/RegistryError";
import { IData } from "../../../../utils/IData";
import { IJointRecord, IEndpointRecord } from "../interfaces/IQueryResults";
import {
  IRegisterAas,
  IAssignRoles,
  ICreateRole,
  ICreateSemanticProtocol
} from "../interfaces/IApiRequests";
import {
  RegistryRolesResultSet,
  CreateRoleResultSet,
  ICreateRoleResultSet
} from "../interfaces/IRegistryRolesSet";
class Registry implements iRegistry {
  private client: any;

  constructor(client: any) {
    //https://node-postgres.com/
    this.client = client;
  }
  release(): void {
    this.client.release();
  }
  async registerAas(record: IRegisterAas): Promise<IRegistryResultSet> {
    //create asset entry
    try {
      const insertAssetResult = await this.client.query(
        ' INSERT INTO public.assets( "assetId", "idType") VALUES ($1, $2);',
        [record.assetId.id, record.assetId.idType]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log("Asset already exist");
      } else {
        throw e;
      }
    }
    try {
      //create aas entry
      const insertAasResult = await this.client.query(
        'INSERT INTO public.asset_administration_shells("aasId", "idType", "assetId") VALUES ($1, $2, $3);',
        [record.aasId.id, record.aasId.idType, record.assetId.id]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log("AAS already exist");
      } else {
        throw e;
      }
    }
    try {
      //delete existig
      const deleteEndpointResult = await this.client.query(
        'DELETE FROM public.endpoints WHERE "aasId" = $1;',
        [record.aasId.id]
      );
      //create endpoint entry
      record.endpoints.forEach(async (endpoint: IEndpoint) => {
        const insertEndpointResult = await this.client.query(
          'INSERT INTO public.endpoints( "URL", protocol_name, protocol_version, "aasId") VALUES ($1, $2, $3, $4);',
          [
            endpoint.url,
            endpoint.protocol,
            endpoint.protocolVersion,
            record.aasId.id
          ]
        );
      });
    } catch (e) {
      if (e.code == 23505) {
        console.log("Endpoint already exist");
      } else {
        throw e;
      }
    }
    console.log(record);
    return record;
  }
  updateAas(record: IRegisterAas): Promise<IRegistryResultSet> {
    throw new Error("Method not implemented.");
  }
  deleteAasByAasId(aasId: Identifier): Promise<void> {
    throw new Error("Method not implemented.");
  }
  listAasByAssetId(assetId: Identifier): Promise<IRegistryResultSet[]> {
    throw new Error("Method not implemented.");
  }
  listAas(): Promise<IRegistryResultSet[]> {
    throw new Error("Method not implemented.");
  }

  async createSemanticProtocol(
    record: import("../interfaces/IApiRequests").ICreateSemanticProtocol
  ): Promise<ICreateSemanticProtocol> {
    try {
      const insertRolesResult = await this.client.query(
        'INSERT INTO public.semantic_protocols("protocolId") VALUES ($1);',
        [record.semanticProtocol]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log("Role already exist");
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
        console.log("aasId "+record.aasId.id + " with role id "+record.roleId);

        const insertRolesResult = await this.client.query(
          'INSERT INTO public.aas_role("aasId","roleId")  VALUES ($1, $2);',
          [record.aasId.id, record.roleId]
        );

    } catch (e) {
      if (e.code == 23505) {
        console.log("Role Assignment already exists");
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
        [record.roleId,
        record.semanticProtocol]
      );
    } catch (e) {
      if (e.code == 23505) {
        console.log("Role already exist");
      } else {
        throw e;
      }
    }

    console.log(record);
    return record;
  }

  async readRecordByAasId(
    aasId: Identifier
  ): Promise<Array<IRegistryResultSet>> {
    try {
      console.log(aasId);
      const aasRecords = await this.client.query(
        'SELECT * FROM public.asset_administration_shells WHERE "aasId" = $1',
        [aasId.id]
      );
      if (aasRecords.rows.length > 0) {
        var aasRecord = aasRecords.rows[0];
        const endpointRecords = await this.client.query(
          'SELECT * FROM public.endpoints WHERE "aasId" = $1',
          [aasRecord.aasId]
        );
        var endpoints: Array<IEndpoint> = [];

        endpointRecords.rows.forEach((endpointRecord: IEndpointRecord) => {
          console.log(endpointRecord);
          var endpoint: IEndpoint = new Endpoint(
            endpointRecord.URL,
            (<any>Protocols)[endpointRecord.protocol_name],
            endpointRecord.protocol_version
          );
          console.log(endpoint);
          endpoints.push(endpoint);
        });
        return [
          new RegistryResultSet(
            { id: aasRecord.aasId, idType: aasRecord.idType },
            endpoints,
            { id: "123", idType: IdTypeEnum.Custom }
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
        'aasWithProtocols."protocol_name" ,aasWithProtocols."protocol_version", aasWithProtocols."roleId",aasWithProtocols."URL" ' +
        "FROM ((SELECT * FROM public.aas_role " +
        "INNER JOIN public.asset_administration_shells " +
        'USING ("aasId") ' +
        'WHERE "roleId" = (SELECT "roleId" FROM public.roles where ' +
        '"protocolId" = $1 and "roleId" = $2 ' +
        "limit 1)) as res " +
        "INNER JOIN public.endpoints " +
        'USING("aasId")) as aasWithProtocols INNER JOIN public.assets USING ("assetId") ';
      const queryResult = await this.client.query(s, [sProtocol, role]);
      const queryResultRows: Array<IJointRecord> = queryResult.rows;
      var recordsByAasId: IData = {};
      queryResultRows.forEach(function(row: IJointRecord) {
        if (!recordsByAasId[row.aasId]) {
          recordsByAasId[row.aasId] = new RegistryResultSet(
            { id: row.aasId, idType: (<any>IdTypeEnum)[row.aasIdType] },
            [
              new Endpoint(
                row.URL,
                (<any>Protocols)[row.protocol_name],
                row.protocol_version
              )
            ],
            { id: row.assetId, idType: (<any>IdTypeEnum)[row.assetIdType] }
          );
        } else {
          recordsByAasId[row.aasId].endpoints.push(
            new Endpoint(
              row.URL,
              (<any>Protocols)[row.protocol_name],
              row.protocol_version
            )
          );
        }
      });
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
