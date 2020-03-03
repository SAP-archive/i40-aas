import { expect, assert } from 'chai';
//import registryRoutes from '../../src/services/registry/routes';
import * as registryApi from '../../src/services/registry/registry-api';
import sinon from 'sinon';
import { IRegisterAas } from '../../src/services/registry/daos/interfaces/IApiRequests';
import { fail } from 'assert';
import { IRegistryResultSet } from '../../src/services/registry/daos/interfaces/IRegistryResultSet';

var rewire = require('rewire');

function makeAASForRegistry(tag: string) {
  return <IRegisterAas>{
    aasId: {
      id: 'aasId' + tag,
      idType: 'IRI'
    },
    endpoints: [{ url: 'url' + tag, protocol: 'protocol' + tag }],
    assetId: {
      id: 'assetId' + tag,
      idType: 'IRI'
    }
  };
}

function wait(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

describe('the post on /aasetadministrationshells', function() {
  var registryRoutes: any;
  var handlerMap: any = {};
  var fakeRegister: any;
  var callCounter = sinon.fake();
  before(() => {
    fakeRegister = sinon.fake(
      () =>
        new Promise((resolve, reject) => {
          setTimeout(() => {
            callCounter();
            return resolve(<IRegistryResultSet>{});
          }, 100);
        })

      /* new Promise<IRegistryResultSet>(async (resolve, reject) => {
          //await wait(1);
          callCounter();
          return <IRegistryResultSet>{};
        })*/
    );

    sinon.replace(registryApi, 'register', fakeRegister);
    registryRoutes = rewire('../../src/services/registry/routes');

    registryRoutes.__set__('registryApi', registryApi);
    for (const route of registryRoutes.default) {
      const { method, path, handler } = route;
      if (!handlerMap[method]) handlerMap[method] = {};
      handlerMap[method][path] = handler;
    }
  });

  it('awaits responses from all calls before sending back a response', function(done) {
    handlerMap['post']['/assetadministrationshells'](
      {
        body: [makeAASForRegistry('a'), makeAASForRegistry('b')]
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
});
