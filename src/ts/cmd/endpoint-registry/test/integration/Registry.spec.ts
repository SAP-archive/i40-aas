import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { logger } from '../../src/log';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server').app;

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
        { address: 'abc.def', type: 'type', target: 'cloud' },
        { address: 'efg.hij', type: 'type', target: 'edge' },
      ],
      certificate_x509_i40: 'certificate',
      signature: 'signature',
    },
  };
}

function makeAASDescriptorWithBadTarget(tag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [
        { address: '%%d//d' + tag, type: 'type' + tag, target: 'blah' },
      ],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithBadUri(tag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [
        { address: '%%d//d' + tag, type: 'type' + tag, target: 'blah' },
      ],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithSlashes(tag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId/' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [
        { address: 'url' + tag, type: 'type' + tag, target: 'cloud' },
      ],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithUri(tag: string, uri: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [{ address: uri, type: 'type' + tag, target: 'cloud' }],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithUriAndProtocol(
  tag: string,
  uri: string,
  type: string
) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [{ address: uri, type: type, target: 'cloud' }],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithAasId(tag: string, id: string) {
  return <IAASDescriptor>{
    identification: {
      id: id,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [
        { address: 'uri' + tag, type: 'type' + tag, target: 'cloud' },
      ],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithEmptyUri(tag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [{ address: '', type: 'type' + tag, target: 'cloud' }],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
}

function makeAASDescriptorWithoutUri(tag: string) {
  return <IAASDescriptor>{
    identification: {
      id: 'aasId' + tag,
      idType: 'IRI',
    },
    asset: {
      id: 'assetId' + tag,
      idType: 'IRI',
    },
    descriptor: {
      endpoints: [{ type: 'type' + tag, target: 'cloud' }],
      certificate_x509_i40: 'cert' + tag,
      signature: 'sig' + tag,
    },
  };
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
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
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

  it('can handle slashes in the id', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeAASDescriptorWithSlashes(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
        await requester
          .get('/AASDescriptors/' + 'aasId%2F' + uniqueTestId)
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
        .send(makeAASDescriptorWithUriAndProtocol(uniqueTestId, 'test', 'test'))
        .then(async (res: any) => {
          chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
          uniqueTestId = 'simpleDataTest' + getRandomInteger();
          await requester
            .put('/AASDescriptors')
            .auth(user, password)
            .send(
              makeAASDescriptorWithUriAndProtocol(uniqueTestId, 'test', 'test')
            )
            .then(async (res: any) => {
              chai.expect(res.status).to.eql(500);
              await requester
                .get('/AASDescriptors/' + uniqueTestId)
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

  it('returns a 500 error if an endpoint with the given uri already exists in the registry', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeAASDescriptorWithUri(uniqueTestId, 'test'))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
        uniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(makeAASDescriptorWithUri(uniqueTestId, 'test'))
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
      .send(makeAASDescriptorWithAasId(uniqueTestId, 'test'))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
        uniqueTestId = 'simpleDataTest' + getRandomInteger();
        await requester
          .put('/AASDescriptors')
          .auth(user, password)
          .send(makeAASDescriptorWithAasId(uniqueTestId + '2', 'test'))
          .then(async (res: any) => {
            chai.expect(res.status).to.eql(200);
            await requester
              .get('/AASDescriptors/test')
              .auth(user, password)
              .then((res: any) => {
                chai.expect(res.status).to.eql(200);
                chai
                  .expect(res.body.asset.id)
                  .to.eql('assetId' + uniqueTestId + '2');
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
      .send(makeAASDescriptorWithEmptyUri(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401); // expression which will be true if response status equal to 200
      });
  });

  it('returns a 401 error if a bad target is provided', async function () {
    var uniqueTestId = 'simpleDataTest' + Math.random();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeAASDescriptorWithBadTarget(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401); // expression which will be true if response status equal to 200
      });
  });

  it('returns a 401 error if the uri is missing in the provided json object', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeAASDescriptorWithoutUri(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401); // expression which will be true if response status equal to 200
      });
  });

  it('returns a 401 error if the uri is badly formatted in the provided json object', async function () {
    var uniqueTestId = 'simpleDataTest' + getRandomInteger();
    var requester = chai.request(app).keepOpen();

    await chai
      .request(app)
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeAASDescriptorWithBadUri(uniqueTestId))
      .then(async (res: any) => {
        chai.expect(res.status).to.eql(401); // expression which will be true if response status equal to 200
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
        chai.expect(res.status).to.eql(500); // expression which will be true if response status equal to 200
      })
      .finally(
        () => (process.env.CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST = host)
      );
  });
});
