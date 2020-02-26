require('dotenv').config({ path: 'tests/.env' });

import { expect } from 'chai';
import {
  readRecordBySemanticProtocolAndRole,
  getEndpointsByReceiverId,
  getEndpointsByReceiverRole,
  register,
  deleteRecordByIdentifier
} from '../src/services/registry/registry-api';
import { ConversationMember, IdTypeEnum } from 'i40-aas-objects';
import { IRegisterAas } from '../src/services/registry/daos/interfaces/IApiRequests';
import { TTarget } from '../src/services/registry/daos/interfaces/IRegistryResultSet';

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

async function insertIntoAasRole(aasId: string, roleId: string) {
  await this.client.query(
    ' INSERT INTO public.aas_role( "aasId", "roleId") VALUES ($1, $2);',
    [aasId, roleId]
  );
}

async function insertIntoEndpoints(
  endpointId: string,
  url: string,
  protocolName: string,
  protocolVersion: string,
  aasId: string,
  target: string
) {
  this.client.query(
    'INSERT INTO public.endpoints( "URL", protocol_name, protocol_version, "aasId",target) VALUES ($1, $2, $3, $4, $5);',
    [url, protocolName, protocolVersion, aasId, target]
  );
}

describe('listAllEndpoints', function() {
  before(async () => {
    console.log(await execShellCommand('sh ./prepareDB.sh'));
  });

  it('returns all properties and values for a single endpoint', async function() {
    //console.log('DB:' + process.env['ENDPOINT_REGISTRY_POSTGRES_DB']);

    var x = await readRecordBySemanticProtocolAndRole(
      'i40:registry-semanticProtocol/onboarding',
      'Approver'
    );
    expect(x)
      .to.be.an('array')
      .with.length.greaterThan(0);
  });
});

describe('read endpoints from pg', function() {
  it('returns endpoints by role', async function() {
    var x = await readRecordBySemanticProtocolAndRole(
      'i40:registry-semanticProtocol/onboarding',
      'Approver'
    );
    expect(x)
      .to.be.an('array')
      .with.length.greaterThan(0);
  });
});

describe('read endpoints from pg', function() {
  it('returns an emptry array', async function() {
    var x = await readRecordBySemanticProtocolAndRole(
      'notExisting',
      'Approver'
    );
    expect(x)
      .to.be.an('array')
      .with.length(0);
  });
});

describe('read endpoints from pg by receiver id', function() {
  it('returns endpoints by id', async function() {
    var x = await getEndpointsByReceiverId(
      'https://i40-test-aas-server.cfapps.eu10.hana.ondemand.com/aas',
      'Custom'
    );

    expect(x)
      .to.be.an('array')
      .with.length.greaterThan(0);
  });
});

describe('read endpoints from pg by receiver role', function() {
  it('returns endpoints by id', async function() {
    var x = await getEndpointsByReceiverRole(
      'Operator',
      'i40:registry-semanticProtocol/onboarding'
    );

    expect(x)
      .to.be.an('array')
      .with.length.greaterThan(0);
  });
});

describe('read endpoints from pg by frame with wrong role', function() {
  it('returns empty array', async function() {
    var x = await getEndpointsByReceiverRole(
      'Operator',
      'i40:registry-semanticProtocol/onboarding'
    );

    expect(x)
      .to.be.an('array')
      .with.length(0);
  });
});

describe('delete registered enntries based on the aasId', function() {
  it('returns empty array', async function() {
    let endpointsAssignment: IRegisterAas = {
      aasId: { id: 'https://foo-bar.com/aas', idType: IdTypeEnum.Custom },
      endpoints: [
        {
          url: 'https://foo-bar/ingress',
          protocol: 'https',
          protocolVersion: '1.1',
          target: TTarget.cloud
        }
      ],
      assetId: { id: 'https://foo-bar.com', idType: IdTypeEnum.Custom }
    };

    var x = await register(endpointsAssignment);

    var d = await deleteRecordByIdentifier(endpointsAssignment.aasId);

    expect(d)
      .to.be.an('number')
      .greaterThan(0);
  });

  it('try to delete a non registered AAS', async function() {
    let endpointsAssignment: IRegisterAas = {
      aasId: { id: 'https://foo-bar.com/aas', idType: IdTypeEnum.Custom },
      endpoints: [
        {
          url: 'https://foo-bar/ingress',
          protocol: 'httss',
          protocolVersion: '1.1',
          target: TTarget.cloud
        }
      ],
      assetId: { id: 'https://foo-bar.com', idType: IdTypeEnum.Custom }
    };

    var x = await register(endpointsAssignment);

    let fakeId = { id: 'https://not-there.com/aas', idType: IdTypeEnum.Custom };

    var d = await deleteRecordByIdentifier(fakeId);

    expect(d)
      .to.be.an('number')
      .equals(0);
  });
});
