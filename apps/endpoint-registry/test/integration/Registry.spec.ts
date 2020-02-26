require('dotenv').config({ path: 'test/.env' });

import { expect } from 'chai';

import { getAllEndpointsList } from '../../src/services/registry/registry-api';
import { RegistryFactory } from '../../src/services/registry/daos/postgress/RegistryFactory';

function execShellCommand(cmd: any) {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.warn(error);
      } else {
        console.log('command executed correctly');
      }
      //console.log(`stdout: ${stdout}`);
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
    testGlobals = { client: await RegistryFactory.getDbClient() };
  });

  it('returns all properties and values for a single endpoint', async function() {
    //console.log('DB:' + process.env['ENDPOINT_REGISTRY_POSTGRES_DB']);
    await insertIntoSemanticProtocols(
      'i40:registry-semanticProtocol/onboarding',
      testGlobals.client
    );
    await insertIntoRoles(
      'CentralAssetRepository',
      'i40:registry-semanticProtocol/onboarding',
      testGlobals.client
    );
    await insertIntoAssets(
      'http://i40-aas-service.westeurope.cloudapp.azure.com',
      'IRI',
      testGlobals.client
    );
    await insertIntoAssetAdministrationShells(
      'http://i40-aas-service.westeurope.cloudapp.azure.com/aas',
      'IRI',
      'http://i40-aas-service.westeurope.cloudapp.azure.com',
      testGlobals.client
    );
    await insertIntoAasRole(
      'http://i40-aas-service.westeurope.cloudapp.azure.com/aas',
      'CentralAssetRepository',
      testGlobals.client
    );

    await insertIntoEndpoints(
      'http://i40-aas-service.westeurope.cloudapp.azure.com/https-endpoint/interaction',
      'https',
      '1.1',
      'http://i40-aas-service.westeurope.cloudapp.azure.com/aas',
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
