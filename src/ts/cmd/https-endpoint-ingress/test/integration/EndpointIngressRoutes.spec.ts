import fs from 'fs';
import chaiHttp = require('chai-http');

var chai = require('chai');
chai.use(chaiHttp);

const app = require('../../src/server').app;

// Then either:
var expect = chai.expect;
const assert = chai.assert;

var INGRESS_ADMIN_USER = process.env.CORE_INGRESS_HTTP_USER;
var INGRESS_ADMIN_PASS = process.env.CORE_INGRESS_HTTP_PASSWORD;
// or:
//var assert = chai.assert;
// or:
chai.should();

describe('the server', async function () {
  let interaction: string;

  //read a sample interaction.json to use as body for requests
  before(function (done) {
    fs.readFile('./sample_interaction.json', 'utf8', function (
      err,
      fileContents
    ) {
      if (err) throw err;
      interaction = fileContents;
      done();
    });
  });

  it("should return a 'Server Up' response on call to /health", async () => {
    return chai
      .request(app)
      .get('/health')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .then(function (res: any) {
        chai.expect(res.text).to.eql('Server Up!');
      });
  });

  it('Should return a 401 if basic auth credentials false', (done) => {
    chai
      .request(app)
      .post('/interaction')
      .auth('foo', 'bar')
      .send({
        id: 234242,
        data: {
          displayname: 'name',
          avatar: 'displayname',
        },
      })
      .then((res: any) => {
        chai.expect(res.status).to.eql(401); // expression which will be true if response status equal to 200
        done();
      });
  });

  it('Should return a 200 if no errors are encountered and if interaction message successfully forwarded to broker', (done) => {
    chai
      .request(app)
      .post('/interaction')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .set('content-type', 'application/json')
      .send(interaction)
      .then((res: any) => {
        //chai.assert(res.body.displayname).to.eql('name'); // assertion expression which will be true if "displayname" equal to "name"
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
        done();
      });
  });

  it('will give a 400 response if the input is not parseable', async function () {
    return chai
      .request(app)
      .post('/interaction')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .set('content-type', 'application/json')
      .send(interaction + 'xx')
      .then(function (res: any) {
        chai.expect(res).to.have.status(400);
      });
  });
  it('will give a 404 Not Found response if the endpoint not found', async function () {
    return chai
      .request(app)
      .post('/foo')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .set('content-type', 'application/json')
      .send(interaction)
      .then(function (res: any) {
        chai.expect(res).to.have.status(404);
      });
  });

  it('will give a 422 response if the receiver role is missing', async function () {
    let request = {
      frame: {
        semanticProtocol: 'i40:registry-semanticProtocol/onboarding',
        type: 'publishInstance',
        messageId: 'Sample_Msg_ID_000',
        replyBy: 29993912,
        receiver: {},
        sender: {
          identification: {
            id: 'https://i40-test-aas-server.cfapps.eu10.hana.ondemand.com/aas',
            idType: 'URI',
          },
          role: { name: 'Operator' },
        },
        conversationId: 'Foo_Conv_ID_000',
      },
      interactionElements: [],
    };

    return chai
      .request(app)
      .post('/interaction')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .set('content-type', 'application/json')
      .send(request)
      .then(function (res: any) {
        chai.expect(res).to.have.status(422);
      });
  });

  it('will give a 404 response body empty', async function () {
    return chai
      .request(app)
      .post('/submodel')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .set('content-type', 'application/json')
      .send()
      .then(function (res: any) {
        chai.expect(res).to.have.status(404);
      });
  });
});
