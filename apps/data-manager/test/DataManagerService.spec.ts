import sinon from "sinon";
import fs from "fs";
import boom = require("boom");
import chaiHttp = require("chai-http");
import Axios, { AxiosError } from "axios";

const dotenv = require("dotenv");
dotenv.config();

var DATAMANAGER_USER = process.env.DATAMANGER_USER;
var DATAMANAGER_PASS = process.env.DATAMANAGER_PASS;

var chai = require("chai");
chai.use(chaiHttp);

const app = require("../src/server").app;

// Then either:
var expect = chai.expect;
const assert = chai.assert;

// or:
//var assert = chai.assert;
// or:
chai.should();

describe("the server", async function() {
  let submodelsArray: string;

  //read a sample interaction.json to use as body for requests
  before(function(done) {
    var fs = require("fs"),
      path = require("path"),
      filePath = path.join(__dirname, "opcua-submodel-instance.json");

    fs.readFile(filePath, "utf8", function(err: any, fileContents: string) {
      if (err) throw err;
      submodelsArray = fileContents;
      done();
    });
  });

  it("should return a 'Server Up' response on call to /health", async () => {
    return chai
      .request(app)
      .get("/health")
      .auth(DATAMANAGER_USER, DATAMANAGER_PASS)
      .then(function(res: any) {
        chai.expect(res.text).to.eql("Server Up!");
      });
  });
  /*
  it("Should return a 401 if basic auth credentials false", done => {
    chai
      .request(app)
      .post("/submodels")
      .auth("foo", "bar")
      .send({
        id: 234242,
        data: {
          displayname: "name",
          avatar: "displayname"
        }
      })
      .then((res: any) => {
        chai.expect(res.status).to.eql(401); // expression which will be true if response status equal to 200
        done();
      });
  });
*/
  it("will give a 422 response if the submodel IdShort is missing", async () => {
    let request = [
      {
        embeddedDataSpecifications: [],
        semanticId: {
          keys: [
            {
              idType: "URI",
              type: "GlobalReference",
              value:
                "opcfoundation.org/specifications-unified-architecture/part-100-device-information-model/",
              local: false
            }
          ]
        },
        kind: "Instance",
        descriptions: [],
        identification: {
          id:
            "sap.com/aas/submodels/part-100-device-information-model/10JF-1234-Jf14-PP22",
          idType: "URI"
        },
        modelType: {
          name: "Submodel"
        },
        submodelElements: []
      }
    ];

    return chai
      .request(app)
      .post("/submodels")
      .auth(DATAMANAGER_USER, DATAMANAGER_PASS)
      .set("content-type", "application/json")
      .send(request)
      .then(function(res: any) {
        chai.expect(res).to.have.status(422);
      });
  });

  it("will give a 400 response if the input is not parseable", async function() {
    return chai
      .request(app)
      .post("/submodels")
      .auth(DATAMANAGER_USER, DATAMANAGER_PASS)
      .set("content-type", "application/json")
      .send(submodelsArray + "xx")
      .then(function(res: any) {
        chai.expect(res).to.have.status(400);
      });
  });

  /*
  it('Should return a 200 if no errors are encountered and if interaction message successfully forwarded to broker', (done) => {
      chai.request(app).post('/interaction')
      .auth(INGRESS_ADMIN_USER, INGRESS_ADMIN_PASS)
      .set("content-type", "application/json")
      .send(interaction)
      .then((res:any) => { 
        //chai.assert(res.body.displayname).to.eql('name'); // assertion expression which will be true if "displayname" equal to "name" 
        chai.expect(res.status).to.eql(200);// expression which will be true if response status equal to 200 
        done();
      });
    });

    */
});
