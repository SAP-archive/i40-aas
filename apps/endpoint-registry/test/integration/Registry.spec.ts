require('dotenv').config({ path: 'test/env.list' });

import { expect } from 'chai';
import { pgConfig } from '../../src/services/registry/daos/postgress/Connection';
import { getAllEndpointsList } from '../../src/services/registry/registry-api';
const { Pool } = require('pg');

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

describe('getAllEndpointsList', function() {
  var testGlobals: any;

  before(async () => {
    console.log(await execShellCommand('sh ./prepareDB.sh'));
    console.log('Using DB: ' + process.env.ENDPOINT_REGISTRY_POSTGRES_DB);
    testGlobals = {
      client: await new Pool(pgConfig).connect(),
      uniqueTestId: 'getAllEndpointsList'
    };
  });

  it('returns all properties and values for a single endpoint', async function() {
    await insertIntoSemanticProtocols(
      testGlobals.uniqueTestId + 'protocolId',
      testGlobals.client
    );
    await insertIntoRoles(
      testGlobals.uniqueTestId + 'roleId',
      testGlobals.uniqueTestId + 'protocolId',
      testGlobals.client
    );
    await insertIntoAssets(
      testGlobals.uniqueTestId + 'assetId',
      testGlobals.uniqueTestId + 'idType',
      testGlobals.client
    );
    await insertIntoAssetAdministrationShells(
      testGlobals.uniqueTestId + 'aasId',
      testGlobals.uniqueTestId + 'idType',
      testGlobals.uniqueTestId + 'assetId',
      testGlobals.client
    );
    await insertIntoAasRole(
      testGlobals.uniqueTestId + 'aasId',
      testGlobals.uniqueTestId + 'roleId',
      testGlobals.client
    );

    await insertIntoEndpoints(
      testGlobals.uniqueTestId + 'url',
      testGlobals.uniqueTestId + 'protocolName',
      testGlobals.uniqueTestId + 'protocolVersion',
      testGlobals.uniqueTestId + 'aasId',
      'cloud',
      testGlobals.client
    );
    var x = await getAllEndpointsList();
    expect(x)
      .to.be.an('array')
      .with.length(1);
    expect(x[0].endpoints[0]).to.have.property('target', 'cloud');
  });
});
