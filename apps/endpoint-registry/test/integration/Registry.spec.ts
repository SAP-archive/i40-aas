require('dotenv').config({ path: 'test/env.list' });

import { expect } from 'chai';
import { pgConfig } from '../../src/services/registry/daos/postgress/Connection';
import {
  getAllEndpointsList,
  readRecordBySemanticProtocolAndRole,
  register,
  readRecordByIdentifier
} from '../../src/services/registry/registry-api';
import { IRegisterAas } from '../../src/services/registry/daos/interfaces/IApiRequests';
import {
  IJointRecord,
  IEndpointRecord
} from '../../src/services/registry/daos/interfaces/IQueryResults';
import { fail } from 'assert';
const { Pool } = require('pg');
const _ = require('lodash');

function execShellCommand(cmd: any) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.warn(error);
      } else {
        console.log('command executed correctly');
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

function makeDummyAASForRegistry(tag: string) {
  return <IRegisterAas>{
    aasId: {
      id: 'aasId' + tag,
      idType: 'IRI'
    },
    endpoints: [
      { url: 'url' + tag, protocol: 'protocol' + tag, target: 'cloud' }
    ],
    assetId: {
      id: 'assetId' + tag,
      idType: 'IRI'
    }
  };
}

async function insertIntoAasRole(aasId: string, roleId: string, dbClient: any) {
  await dbClient.query(
    ' INSERT INTO public.aas_role( "aasId", "roleId") VALUES ($1, $2);',
    [aasId, roleId]
  );
}

async function insertIntoRoles(
  roleId: string,
  protocolId: string,
  dbClient: any
) {
  await dbClient.query(
    'INSERT INTO public.roles( "roleId", "protocolId") VALUES ($1, $2);',
    [roleId, protocolId]
  );
}

async function insertIntoSemanticProtocols(protocolId: string, dbClient: any) {
  await dbClient.query(
    'INSERT INTO public.semantic_protocols("protocolId") VALUES ($1);',
    [protocolId]
  );
}

async function insertIntoEndpoints(
  url: string,
  protocolName: string,
  protocolVersion: string,
  aasId: string,
  target: string,
  dbClient: any
) {
  dbClient.query(
    'INSERT INTO public.endpoints( "URL", protocol_name, protocol_version, "aasId",target) VALUES ($1, $2, $3, $4, $5);',
    [url, protocolName, protocolVersion, aasId, target]
  );
}

async function insertIntoAssets(
  assetId: string,
  idType: string,
  dbClient: any
) {
  await dbClient.query(
    ' INSERT INTO public.assets( "assetId", "idType") VALUES ($1, $2);',
    [assetId, idType]
  );
}

async function insertIntoAssetAdministrationShells(
  aasId: string,
  idType: string,
  assetId: string,
  dbClient: any
) {
  await dbClient.query(
    'INSERT INTO public.asset_administration_shells("aasId", "idType", "assetId") VALUES ($1, $2, $3);',
    [aasId, idType, assetId]
  );
}
//TODO: reinitialize DB after every test
describe('Tests with a simple data model', function() {
  var testGlobals: any;

  before(async () => {
    console.log(await execShellCommand('sh ./prepareDB.sh'));
    console.log('Using DB: ' + process.env.ENDPOINT_REGISTRY_POSTGRES_DB);
    testGlobals = {
      client: await new Pool(pgConfig).connect()
    };
    var uniqueTestId = 'dataForAllTests';
    await insertIntoSemanticProtocols(
      uniqueTestId + 'protocolId',
      testGlobals.client
    );
    await insertIntoRoles(
      uniqueTestId + 'roleId',
      uniqueTestId + 'protocolId',
      testGlobals.client
    );
    await insertIntoAssets(
      uniqueTestId + 'assetId',
      uniqueTestId + 'idType',
      testGlobals.client
    );
    await insertIntoAssetAdministrationShells(
      uniqueTestId + 'aasId',
      uniqueTestId + 'idType',
      uniqueTestId + 'assetId',
      testGlobals.client
    );
    await insertIntoAasRole(
      uniqueTestId + 'aasId',
      uniqueTestId + 'roleId',
      testGlobals.client
    );

    await insertIntoEndpoints(
      uniqueTestId + 'url',
      uniqueTestId + 'protocolName',
      uniqueTestId + 'protocolVersion',
      uniqueTestId + 'aasId',
      'cloud',
      testGlobals.client
    );
  });

  it('gets the list of endpoints using getAllEndpointsList from the DB', async function() {
    var x = await getAllEndpointsList();
    expect(x)
      .to.be.an('array')
      .with.length(1);
    expect(x[0].endpoints[0]).to.have.property('target', 'cloud');
  });

  it('gets the right endpoints when reading by semantic protocol and role', async function() {
    var uniqueTestId = 'readRecordBySemanticProtocolAndRole';

    await insertIntoSemanticProtocols(
      uniqueTestId + 'protocolId',
      testGlobals.client
    );
    await insertIntoRoles(
      uniqueTestId + 'roleId',
      uniqueTestId + 'protocolId',
      testGlobals.client
    );
    await insertIntoAssets(
      uniqueTestId + 'assetId',
      uniqueTestId + 'idType',
      testGlobals.client
    );
    await insertIntoAssetAdministrationShells(
      uniqueTestId + 'aasId',
      uniqueTestId + 'idType',
      uniqueTestId + 'assetId',
      testGlobals.client
    );
    await insertIntoAasRole(
      uniqueTestId + 'aasId',
      uniqueTestId + 'roleId',
      testGlobals.client
    );

    await insertIntoEndpoints(
      uniqueTestId + 'url',
      uniqueTestId + 'protocolName',
      uniqueTestId + 'protocolVersion',
      uniqueTestId + 'aasId',
      'cloud',
      testGlobals.client
    );
    var x = await readRecordBySemanticProtocolAndRole(
      uniqueTestId + 'protocolId',
      uniqueTestId + 'roleId'
    );
    expect(x)
      .to.be.an('array')
      .with.length(1);
    expect(x[0].endpoints[0]).to.have.property(
      'protocol',
      uniqueTestId.toLowerCase() + 'protocolname'
    );
    expect(x[0].endpoints[0]).to.have.property('target', 'cloud');
  });

  it('gets the right endpoints when reading by receiver aas id and id type', async function() {
    var uniqueTestId = 'readRecordByAasId';

    await insertIntoAssets(
      uniqueTestId + 'assetId',
      uniqueTestId + 'idType',
      testGlobals.client
    );
    await insertIntoAssetAdministrationShells(
      uniqueTestId + 'aasId',
      uniqueTestId + 'idType',
      uniqueTestId + 'assetId',
      testGlobals.client
    );

    await insertIntoEndpoints(
      uniqueTestId + 'url',
      uniqueTestId + 'protocolName',
      uniqueTestId + 'protocolVersion',
      uniqueTestId + 'aasId',
      'cloud',
      testGlobals.client
    );

    var x = await readRecordByIdentifier({
      id: uniqueTestId + 'aasId',
      idType: 'IRI'
    });

    expect(x)
      .to.be.an('array')
      .with.length(1);
    expect(x[0].aasId).to.have.property('id', uniqueTestId + 'aasId');
    expect(x[0].endpoints[0]).to.have.property(
      'protocol',
      uniqueTestId.toLowerCase() + 'protocolname'
    );
    expect(x[0].endpoints[0]).to.have.property('target', 'cloud');
  });

  it('registers AASs correctly', async function() {
    var uniqueTestId = 'registerAas';
    var registerJson: IRegisterAas = makeDummyAASForRegistry(uniqueTestId);
    await register(registerJson);
    var s = `SELECT  * FROM  public.endpoints`;
    const resultOfQuery = await testGlobals.client.query(s);
    const queryResultRows: Array<IEndpointRecord> = resultOfQuery.rows;
    expect(
      _.some(
        queryResultRows,
        (e: IEndpointRecord) => e.aasId == 'aasId' + uniqueTestId
      )
    ).to.be.true;
    expect(
      _.some(
        queryResultRows,
        (e: IEndpointRecord) => e.protocol_name == 'protocol' + uniqueTestId
      )
    ).to.be.true;
  });

  it('rolls back if there is an error when registering', async function() {
    var uniqueTestId = 'registerAasWithProblem';

    await insertIntoAssets(
      'assetId' + uniqueTestId + 'x',
      'IRI',
      testGlobals.client
    );
    await insertIntoAssetAdministrationShells(
      'aasId' + uniqueTestId,
      'IRI',
      'assetId' + uniqueTestId + 'x',
      testGlobals.client
    );

    //there shall be no conflict when writing the asset because the
    //asset in the database has id 'assetId' + uniqueTestId + 'x'
    //with 'x' at then end. But writing to asset_administration_shells
    //should fail because it has PK aasId = 'aasId' + uniqueTestId

    var registerJson: IRegisterAas = makeDummyAASForRegistry(uniqueTestId);
    try {
      await register(registerJson);
    } catch (error) {
      const resultOfAssetQuery = await testGlobals.client.query(
        'SELECT  * FROM  public.assets WHERE "assetId" = $1;',
        ['assetId' + uniqueTestId + 'x']
      );
      expect(resultOfAssetQuery.rows.length == 0);

      var s = `SELECT  * FROM  public.endpoints`;
      const resultOfEndpointQuery = await testGlobals.client.query(s);
      const queryResultRows: Array<IEndpointRecord> =
        resultOfEndpointQuery.rows;
      //endpoint should not be there
      expect(
        _.some(
          queryResultRows,
          (e: IEndpointRecord) => e.aasId == 'aasId' + uniqueTestId
        )
      ).to.be.false;
      return;
    }
    fail('This test should have resulted in a duplicate key exception');
  });
});
