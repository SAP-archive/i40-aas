import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { logger } from '../../src/log';
import { IEndpoint } from '../../src/services/registry/daos/interfaces/IEndpoint';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server').app;
var _ = require('lodash');

chai.should();
chai.use(chaiHttp);

function getRandomInteger() {
  return Math.floor(Math.random() * 100000);
}

function makeGoodAASDescriptor(idTag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + idTag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + idTag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [
        { address: 'abc.def/' + idTag, type: 'type', target: 'cloud' },
        { address: 'efg.hij/' + idTag, type: 'type', target: 'edge' },
      ],
      certificate_x509_i40: 'certificate',
      signature: 'signature',
    },
  };
}

function replaceEndpoints(
  descriptor: IAASDescriptor,
  endpoints: Array<IEndpoint>
) {
  descriptor.descriptor.endpoints = endpoints;
  return descriptor;
}

function replaceTargetInFirstEndpoint(
  descriptor: IAASDescriptor,
  replacement: string
) {
  descriptor.descriptor.endpoints[0].target = replacement;
  return descriptor;
}

function replaceAddressInFirstEndpoint(
  descriptor: IAASDescriptor,
  replacement: string
) {
  descriptor.descriptor.endpoints[0].address = replacement;
  return descriptor;
}

function removeAddressInFirstEndpoint(descriptor: IAASDescriptor) {
  (<unknown>descriptor.descriptor.endpoints[0].address) = undefined;
  return descriptor;
}

function replaceAasId(descriptor: IAASDescriptor, replacement: string) {
  descriptor.identification.id = replacement;
  return descriptor;
}

function replaceAddressAndTypeInFirstEndpoint(
  descriptor: IAASDescriptor,
  addressReplacement: string,
  typeReplacement: string
) {
  descriptor.descriptor.endpoints[0].address = addressReplacement;
  descriptor.descriptor.endpoints[0].type = typeReplacement;
  return descriptor;
}

function checkEnvVar(variableName: string) {
  let retVal = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      'A variable that is required by the skill has not been defined in the environment:' +
        variableName
    );
  }
}

describe('Tests with a simple data model', function () {
  var user = process.env.CORE_REGISTRIES_ENDPOINTS_USER;
  var password = process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD;
  before(async () => {
    checkEnvVar('CORE_REGISTRIES_ENDPOINTS_USER');
    checkEnvVar('CORE_REGISTRIES_ENDPOINTS_PASSWORD');
  });

  it('saves a descriptor in the the database', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .get('/AASDescriptors/' + 'aasId' + uniqueTestId)
          .auth(user, password)
          .then((res: any) => {
            chai.expect(res.status).to.eql(200);
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it('returns a 401 error if bad authentication details are provided', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, 'blah')
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it('can handle slashes in the id', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(replaceAasId(makeGoodAASDescriptor(uniqueTestId), 'abc/def.dod'))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .get('/AASDescriptors/' + 'abc%2Fdef.dod')
          .auth(user, password)
          .then((res: any) => {
            chai.expect(res.status).to.eql(200);
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it(
    'returns a 500 error if an endpoint with the given uri and type already' +
      'exists in the registry and removes all traces of the failed descriptor',
    async function () {
      var uniqueTestId = 'simpleDataTest' + getRandomInteger();
      var requester = chai.request(app).keepOpen();

      await requester
        .put('/AASDescriptors')
        .auth(user, password)
        .send(
          replaceAddressAndTypeInFirstEndpoint(
            makeGoodAASDescriptor(uniqueTestId),
            'http://abc.com',
            'http'
          )
        )
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200);
          var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
          await requester
            .put('/AASDescriptors')
            .auth(user, password)
            .send(
              replaceAddressAndTypeInFirstEndpoint(
                makeGoodAASDescriptor(newUniqueTestId),
                'http://abc.com',
                'http'
              )
            )
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(500);
              await requester
                .get('/AASDescriptors/aasId' + newUniqueTestId)
                .auth(user, password)
                .then((res: any) => {
                  chai.expect(res.status).to.eql(404);
                });
            });
        })
        .then(() => {
          requester.close();
        });
    }
  );

  it('deletes an existing descriptor by id', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        await requester
          .delete('/AASDescriptors/aasId' + uniqueTestId)
          .auth(user, password)
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/AASDescriptors/aasId' + uniqueTestId)
              .auth(user, password)
              .then((res: any) => {
                chai.expect(res.status).to.eql(404);
              });
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it('returns a 500 error if an endpoint with the given uri already exists in the registry', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAddressInFirstEndpoint(
          makeGoodAASDescriptor(uniqueTestId),
          'http://abc.com'
        )
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(
            replaceAddressInFirstEndpoint(
              makeGoodAASDescriptor(newUniqueTestId),
              'http://abc.com'
            )
          )
          .then((res: any) => {
            chai.expect(res.status).to.eql(500);
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it('replaces the descriptor if a descriptor with the given id already exists in the registry', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(replaceAasId(makeGoodAASDescriptor(uniqueTestId), 'test'))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(replaceAasId(makeGoodAASDescriptor(newUniqueTestId), 'test'))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/AASDescriptors/test')
              .auth(user, password)
              .then((res: any) => {
                chai.expect(res.status).to.eql(200);
                chai
                  .expect(res.body.asset.id)
                  .to.eql('assetId' + newUniqueTestId);
              });
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it('can update endpoint addresses', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAasId(makeGoodAASDescriptor(uniqueTestId), 'test' + uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(
            replaceEndpoints(
              makeGoodAASDescriptor(uniqueTestId),
              makeGoodAASDescriptor(newUniqueTestId).descriptor.endpoints
            )
          )
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/AASDescriptors/test' + uniqueTestId)
              .auth(user, password)
              .then((res: any) => {
                chai.expect(res.status).to.eql(200);
                chai.expect(
                  _.some(res.body.descriptor.endpoints, {
                    address: 'abc.def/' + newUniqueTestId,
                  })
                ).to.be.true;
                chai.expect(
                  _.some(res.body.descriptor.endpoints, {
                    address: 'efg.hij/' + newUniqueTestId,
                  })
                ).to.be.true;
                chai.expect(res.body.descriptor.endpoints.length).to.eql(2);
              });
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it('patches the descriptor if requested', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAasId(makeGoodAASDescriptor(uniqueTestId), 'test' + uniqueTestId)
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200);
        var newUniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .patch('/AASDescriptors/test' + uniqueTestId)
          .auth(user, password)
          .send({ identification: { idType: 'Custom' } })
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/AASDescriptors/test' + uniqueTestId)
              .auth(user, password)
              .then((res: any) => {
                chai.expect(res.status).to.eql(200);
                chai.expect(res.body.asset.id).to.eql('assetId' + uniqueTestId);
                chai.expect(res.body.identification.idType).to.eql('Custom');
              });
          });
      })
      .then(() => {
        requester.close();
      });
  });

  it('returns a 401 error if the uri is an empty string in the provided json object', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAddressInFirstEndpoint(makeGoodAASDescriptor(uniqueTestId), '')
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it('returns a 401 error if a bad target is provided', async function () {
    var uniqueTestId = 'simpleDataTest' + Math.random();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceTargetInFirstEndpoint(
          makeGoodAASDescriptor(uniqueTestId),
          'blah'
        )
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it('returns a 401 error if the uri is missing in the provided json object', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(removeAddressInFirstEndpoint(makeGoodAASDescriptor(uniqueTestId)))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it('returns a 401 error if a uri is badly formatted in the provided json object', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(
        replaceAddressInFirstEndpoint(
          makeGoodAASDescriptor(uniqueTestId),
          '%%d//d'
        )
      )
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401);
      });
  });

  it('returns a 500 error if a connection to the db could not be got', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var host = process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST;
    process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST = 'blah';
    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeGoodAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(500);
      })
      .finally(
        () => (process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST = host)
      );
  });
});
