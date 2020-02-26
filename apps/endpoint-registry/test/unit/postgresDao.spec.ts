import { config } from 'dotenv';
console.log(config({ path: 'tests/env.list' }));
import { expect } from 'chai';
import {
  readRecordBySemanticProtocolAndRole,
  getEndpointsByReceiverId,
  getEndpointsByReceiverRole,
  register,
  deleteRecordByIdentifier
} from '../../src/services/registry/registry-api';
import { ConversationMember, IdTypeEnum } from 'i40-aas-objects';
import { IRegisterAas } from '../../src/services/registry/daos/interfaces/IApiRequests';
import { TTarget } from '../../src/services/registry/daos/interfaces/IRegistryResultSet';

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
          protocol: 'httss',
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
