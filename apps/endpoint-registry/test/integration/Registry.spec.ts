require('dotenv').config({ path: 'test/env.list' });

import { expect } from 'chai';

import { RegistryApi } from '../../src/services/registry/RegistryApi';
import { IRegisterAas } from '../../src/services/registry/daos/interfaces/IApiRequests';
import { IEndpointRecord } from '../../src/services/registry/daos/interfaces/IQueryResults';
import { fail } from 'assert';
import e = require('express');
import { RegistryFactory } from '../../src/services/registry/daos/postgres/RegistryFactory';

const { Pool } = require('pg');
const _ = require('lodash');
const pool = RegistryFactory.getPool();

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

async function insertIntoAasRole(aasId: string, roleId: string) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query(
      ' INSERT INTO public.aas_role( "aasId", "roleId") VALUES ($1, $2);',
      [aasId, roleId]
    );
  } catch (error) {
    throw e;
  } finally {
    dbClient.release();
  }
}

async function insertIntoRoles(roleId: string, protocolId: string) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query(
      'INSERT INTO public.roles( "roleId", "protocolId") VALUES ($1, $2);',
      [roleId, protocolId]
    );
  } catch (error) {
    throw e;
  } finally {
    dbClient.release();
  }
}

async function insertIntoSemanticProtocols(protocolId: string) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query(
      'INSERT INTO public.semantic_protocols("protocolId") VALUES ($1);',
      [protocolId]
    );
  } catch (error) {
    throw e;
  } finally {
    dbClient.release();
  }
}

async function insertIntoEndpoints(
  url: string,
  protocolName: string,
  protocolVersion: string,
  aasId: string,
  target: string
) {
  const dbClient = await pool.connect();
  try {
    dbClient.query(
      'INSERT INTO public.endpoints( "URL", protocol_name, protocol_version, "aasId",target) VALUES ($1, $2, $3, $4, $5);',
      [url, protocolName, protocolVersion, aasId, target]
    );
  } catch (error) {
    throw e;
  } finally {
    dbClient.release();
  }
}

async function insertIntoAssets(assetId: string, idType: string) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query(
      ' INSERT INTO public.assets( "assetId", "idType") VALUES ($1, $2);',
      [assetId, idType]
    );
  } catch (error) {
    throw e;
  } finally {
    dbClient.release();
  }
}

async function insertIntoAssetAdministrationShells(
  aasId: string,
  idType: string,
  assetId: string
) {
  const dbClient = await pool.connect();
  try {
    await dbClient.query(
      'INSERT INTO public.asset_administration_shells("aasId", "idType", "assetId") VALUES ($1, $2, $3);',
      [aasId, idType, assetId]
    );
  } catch (error) {
    throw e;
  } finally {
    dbClient.release();
  }
}

//TODO: reinitialize DB after every test
describe('Tests with a simple data model', function() {
  before(async () => {
    console.log(await execShellCommand('sh ./prepareDB.sh'));
    console.log('Using DB: ' + process.env.ENDPOINT_REGISTRY_POSTGRES_DB);

    var uniqueTestId = 'dataForAllTests';
    await insertIntoSemanticProtocols(uniqueTestId + 'protocolId');
    await insertIntoRoles(uniqueTestId + 'roleId', uniqueTestId + 'protocolId');
    await insertIntoAssets(uniqueTestId + 'assetId', uniqueTestId + 'idType');
    await insertIntoAssetAdministrationShells(
      uniqueTestId + 'aasId',
      uniqueTestId + 'idType',
      uniqueTestId + 'assetId'
    );
    await insertIntoAasRole(uniqueTestId + 'aasId', uniqueTestId + 'roleId');

    await insertIntoEndpoints(
      uniqueTestId + 'url',
      uniqueTestId + 'protocolName',
      uniqueTestId + 'protocolVersion',
      uniqueTestId + 'aasId',
      'cloud'
    );
  });

  it('gets the list of endpoints using getAllEndpointsList from the DB', async function() {
    var x = await new RegistryApi().getAllEndpointsList();
    expect(x)
      .to.be.an('array')
      .with.length(1);
    expect(x[0].endpoints[0]).to.have.property('target', 'cloud');
  });

  it('gets the right endpoints when reading by semantic protocol and role', async function() {
    var uniqueTestId = 'readRecordBySemanticProtocolAndRole';

    await insertIntoSemanticProtocols(uniqueTestId + 'protocolId');
    await insertIntoRoles(uniqueTestId + 'roleId', uniqueTestId + 'protocolId');
    await insertIntoAssets(uniqueTestId + 'assetId', uniqueTestId + 'idType');
    await insertIntoAssetAdministrationShells(
      uniqueTestId + 'aasId',
      uniqueTestId + 'idType',
      uniqueTestId + 'assetId'
    );
    await insertIntoAasRole(uniqueTestId + 'aasId', uniqueTestId + 'roleId');

    await insertIntoEndpoints(
      uniqueTestId + 'url',
      uniqueTestId + 'protocolName',
      uniqueTestId + 'protocolVersion',
      uniqueTestId + 'aasId',
      'cloud'
    );
    var x = await new RegistryApi().readRecordBySemanticProtocolAndRole(
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

    await insertIntoAssets(uniqueTestId + 'assetId', uniqueTestId + 'idType');
    await insertIntoAssetAdministrationShells(
      uniqueTestId + 'aasId',
      uniqueTestId + 'idType',
      uniqueTestId + 'assetId'
    );

    await insertIntoEndpoints(
      uniqueTestId + 'url',
      uniqueTestId + 'protocolName',
      uniqueTestId + 'protocolVersion',
      uniqueTestId + 'aasId',
      'cloud'
    );

    var x = await new RegistryApi().readRecordByIdentifier({
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
    await new RegistryApi().register(registerJson);
    var s = `SELECT  * FROM  public.endpoints`;
    const dbClient = await pool.connect();
    try {
      const resultOfQuery = await dbClient.query(s);
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
    } catch (error) {
      fail('Exception thrown');
    } finally {
      dbClient.release();
    }
  });

  it('rolls back if there is an error when registering', async function() {
    var uniqueTestId = 'registerAasWithProblem';

    await insertIntoAssets('assetId' + uniqueTestId + 'x', 'IRI');
    await insertIntoAssetAdministrationShells(
      'aasId' + uniqueTestId,
      'IRI',
      'assetId' + uniqueTestId + 'x'
    );

    //there shall be no conflict when writing the asset because the
    //asset in the database has id 'assetId' + uniqueTestId + 'x'
    //with 'x' at then end. But writing to asset_administration_shells
    //should fail because it has PK aasId = 'aasId' + uniqueTestId

    var registerJson: IRegisterAas = makeDummyAASForRegistry(uniqueTestId);
    try {
      await new RegistryApi().register(registerJson);
    } catch (error) {
      const dbClient = await pool.connect();
      try {
        const resultOfAssetQuery = await dbClient.query(
          'SELECT  * FROM  public.assets WHERE "assetId" = $1;',
          ['assetId' + uniqueTestId + 'x']
        );
        expect(resultOfAssetQuery.rows.length == 0);

        var s = `SELECT  * FROM  public.endpoints`;
        const resultOfEndpointQuery = await dbClient.query(s);
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
      } catch (error) {
        fail('Exception thrown in test');
      } finally {
        dbClient.release();
      }
    }
    fail('This test should have resulted in a duplicate key exception');
  });
});
