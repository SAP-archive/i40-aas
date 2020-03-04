import { expect, assert } from 'chai';
import sinon from 'sinon';
import { RegistryApi } from '../../src/services/registry/registry-api';
import {
  IRegisterAas,
  ICreateRole,
  IAssignRoles
} from '../../src/services/registry/daos/interfaces/IApiRequests';
import { IRegistryResultSet } from '../../src/services/registry/daos/interfaces/IRegistryResultSet';

var rewire = require('rewire');

function makeDummyAAS(tag: string) {
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

function makeDummyRoleAssignment(tag: string) {
  return <IAssignRoles>{
    aasId: {
      id: 'aasId' + tag,
      idType: 'IRI'
    },
    roleId: 'roleId' + tag
  };
}

function makeDummyRole(tag: string) {
  return <ICreateRole>{
    roleId: 'roleId' + tag,
    semanticProtocol: 'semanticProtocol'
  };
}

function wait(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

describe('routes', function() {
  var registryRoutes: any;
  var handlerMap: any = {};
  var fakeApiCallWithDelay: any;
  var callCounter = sinon.fake();
  var registryApi: RegistryApi;
  before(() => {
    fakeApiCallWithDelay = sinon.fake(
      () =>
        new Promise((resolve, reject) => {
          setTimeout(() => {
            callCounter();
            return resolve(<IRegistryResultSet>{});
          }, 100);
        })
    );
    registryApi = new RegistryApi();
    registryRoutes = rewire('../../src/services/registry/routes');

    registryRoutes.__set__('registryApi', registryApi);
    for (const route of registryRoutes.default) {
      const { method, path, handler } = route;
      if (!handlerMap[method]) handlerMap[method] = {};
      handlerMap[method][path] = handler;
    }
  });

  afterEach(() => {
    sinon.restore();
    callCounter.resetHistory();
  });

  it('awaits responses from all calls before sending back a response when creating AASs', function(done) {
    sinon.replace(registryApi, 'register', fakeApiCallWithDelay);
    handlerMap['post']['/assetadministrationshells'](
      {
        body: [makeDummyAAS('register1'), makeDummyAAS('register2')]
      },
      {
        json: function(json: string) {
          if (callCounter.callCount == 2) {
            done();
          } else {
            done(
              'Not all promises were resolved before sending the response back'
            );
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('awaits responses from all calls before sending back a response when creating roles', function(done) {
    sinon.replace(registryApi, 'createRole', fakeApiCallWithDelay);
    handlerMap['post']['/roles'](
      {
        body: [makeDummyRole('createRole1'), makeDummyRole('createRole2')]
      },
      {
        json: function(json: string) {
          if (callCounter.callCount == 2) {
            done();
          } else {
            done(
              'Not all promises were resolved before sending the response back'
            );
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('awaits responses from all calls before sending back a response when creating role asignments', function(done) {
    sinon.replace(registryApi, 'assignRolesToAAS', fakeApiCallWithDelay);
    handlerMap['post']['/roleassignment'](
      {
        body: [
          makeDummyRoleAssignment('assignRolesToAAS'),
          makeDummyRoleAssignment('assignRolesToAAS')
        ]
      },
      {
        json: function(json: string) {
          if (callCounter.callCount == 2) {
            done();
          } else {
            done(
              'Not all promises were resolved before sending the response back'
            );
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('awaits responses from all calls before sending back a response when creating an asset', function(done) {
    sinon.replace(registryApi, 'createAsset', fakeApiCallWithDelay);
    handlerMap['post']['/asset'](
      {
        body: {
          semanticProtocol: 'semanticProtocol' + 'createSemanticProtocol'
        }
      },
      {
        json: function(json: string) {
          if (callCounter.callCount == 1) {
            done();
          } else {
            done(
              'Not all promises were resolved before sending the response back'
            );
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('awaits responses from all calls before sending back a response when creating role asignments', function(done) {
    sinon.replace(registryApi, 'createAsset', fakeApiCallWithDelay);
    handlerMap['post']['/asset'](
      {
        body: { assetId: 'assetId' + 'createAsset' }
      },
      {
        json: function(json: string) {
          if (callCounter.callCount == 1) {
            done();
          } else {
            done(
              'Not all promises were resolved before sending the response back'
            );
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('calls getAllEndpointsList if a GET on listAllEndpoints is made', function(done) {
    sinon.replace(registryApi, 'getAllEndpointsList', fakeApiCallWithDelay);
    handlerMap['get']['/listAllEndpoints'](
      {},
      {
        json: function(json: string) {
          if (callCounter.callCount == 1) {
            done();
          } else {
            done(
              'Not all promises were resolved before sending the response back'
            );
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('calls deleteRecordByIdentifier with the right parameters when a DELETE on /assetadministrationshells is made', function(done) {
    var fake = sinon.fake.resolves({});
    sinon.replace(registryApi, 'deleteRecordByIdentifier', fake);
    handlerMap['delete']['/assetadministrationshells'](
      { query: { id: 'aasId' + 'deleteRecordByIdentifier', idType: 'IRI' } },
      {
        json: function(json: string) {
          if (
            fake.calledWith({
              id: 'aasId' + 'deleteRecordByIdentifier',
              idType: 'IRI'
            })
          ) {
            done();
          } else {
            done('Call did not take place correctly');
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });

  it('calls getEndpointsByReceiverId  depending on the parameters passed', function(done) {
    var fakeByReceiverId = sinon.fake.resolves([]);
    sinon.replace(registryApi, 'getEndpointsByReceiverId', fakeByReceiverId);
    handlerMap['get']['/assetadministrationshells'](
      {
        query: {
          receiverId: 'receiverId' + 'getEndpointsByReceiverId',
          receiverIdType: 'IRI'
        }
      },
      {
        json: function(json: string) {
          if (
            fakeByReceiverId.calledWith(
              'receiverId' + 'getEndpointsByReceiverId',
              'IRI'
            )
          ) {
            done();
          } else {
            done('Call did not take place correctly');
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });
  it('calls getEndpointsByReceiverRole  depending on the parameters passed', function(done) {
    var fakeByReceiverRole = sinon.fake.resolves([]);
    sinon.replace(
      registryApi,
      'getEndpointsByReceiverRole',
      fakeByReceiverRole
    );
    handlerMap['get']['/assetadministrationshells'](
      {
        query: {
          receiverRole: 'receiverRole' + 'getEndpointsByReceiverRole',
          semanticProtocol: 'semanticProtocol' + 'getEndpointsByReceiverRole'
        }
      },
      {
        json: function(json: string) {
          if (
            fakeByReceiverRole.calledWith(
              'receiverRole' + 'getEndpointsByReceiverRole',
              'semanticProtocol' + 'getEndpointsByReceiverRole'
            )
          ) {
            done();
          } else {
            done('Call did not take place correctly');
          }
        },
        end: function(json: string) {
          done('There was an error from the the registry-api');
        }
      }
    );
  });
});
