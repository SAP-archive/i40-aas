import { IAASDescriptor } from '../../src/services/registry/daos/interfaces/IAASDescriptor';
import { logger } from '../../src/log';
//const client = getConnection();

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../src/server').app;

chai.should();
chai.use(chaiHttp);

function makeDummyAASDescriptor(tag: string) {
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
        { address: 'url' + tag, type: 'type' + tag, target: 'cloud' },
      ],
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

function sleep(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

describe('Tests with a simple data model', function () {
  var user = process.env.CORE_REGISTRIES_ENDPOINTS_USER;
  var password = process.env.CORE_REGISTRIES_ENDPOINTS_PASSWORD;
  before(async () => {
    checkEnvVar('CORE_REGISTRIES_ENDPOINTS_USER');
    checkEnvVar('CORE_REGISTRIES_ENDPOINTS_PASSWORD');
  });

  it('saves a descriptor in the the database', async function () {
    logger.debug('Connecting using ' + user + '/' + password);
    var uniqueTestId = 'simpleDataTest' + Math.random();
    var requester = chai.request(app).keepOpen();

    await requester
      .put('/AASDescriptors')
      .auth(user, password)
      .send(makeDummyAASDescriptor(uniqueTestId))
      .then(async (res: any) => {
        logger.debug('made one call');
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
        await requester
          .get('/AASDescriptors/' + 'aasId' + uniqueTestId)
          .auth(user, password)
          .then((res: any) => {
            chai.expect(res.status).to.eql(200);
            logger.debug('test complete');
          });
      })
      .then(() => {
        requester.close();
        //done();
      });
  });
});
