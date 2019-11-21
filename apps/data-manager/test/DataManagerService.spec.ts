import sinon from "sinon";
import chaiHttp = require("chai-http");
import Axios, { AxiosError } from "axios";
import { AdapterRegistryConnector } from "../src/services/data-manager/RegistryConnector";
import { WebClient } from "../src/services/data-manager/WebClient/WebClient";
import { IStorageAdapter } from "../src/services/data-manager/interfaces/IStorageAdapter";
import { AdapterConnector } from "../src/services/data-manager/AdapterConnector";
import { RoutingController } from "../src/services/data-manager/RoutingController";

const dotenv = require("dotenv");
dotenv.config();

var DATA_MANAGER_USER = process.env.DATA_MANAGER_USER;
var DATA_MANAGER_PASSWORD = process.env.DATA_MANAGER_PASSWORD;

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
  let submodelsRequest: string;

  //read a sample interaction.json to use as body for requests
  before(function(done) {
    var fs = require("fs"),
      path = require("path"),
      filePath = path.join(__dirname, "opcua-submodel-instance.json");

    fs.readFile(filePath, "utf8", function(err: any, fileContents: string) {
      if (err) throw err;
      submodelsRequest = fileContents;
      done();
    });
  });

  it("should return a 'Server Up' response on call to /health", () => {
    return chai
      .request(app)
      .get("/health")
      .auth(DATA_MANAGER_USER, DATA_MANAGER_PASSWORD)
      .then(function(res: any) {
        chai.expect(res.text).to.eql("Server Up!");
      });
  });
  
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

  it("will give a 422 response if the submodel IdShort is missing", () => {
    let submodelRequestNoId = [
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
      .auth(DATA_MANAGER_USER, DATA_MANAGER_PASSWORD)
      .set("content-type", "application/json")
      .send(submodelRequestNoId)
      .then(function(res: any) {
        chai.expect(res).to.have.status(422);
      });
  });

  it("will give a 400 response if the input is not parseable", function() {
    return chai
      .request(app)
      .post("/submodels")
      .auth(DATA_MANAGER_USER, DATA_MANAGER_PASSWORD)
      .set("content-type", "application/json")
      .send(submodelsRequest + "xx")
      .then(function(res: any) {
        chai.expect(res).to.have.status(400);
      });
  });
  it("will give a 400 response if request body empty", () => {
    return chai
      .request(app)
      .post("/submodels")
      .auth(DATA_MANAGER_USER, DATA_MANAGER_PASSWORD)
      .set("content-type", "application/json")
      .send("")
      .then(function(res: any) {
        chai.expect(res).to.have.status(400);
      });
  });

  it("Should return a 200 if no errors are encountered and if submodel forwarded to adapter", done => {
    sinon.replace(
      RoutingController,
      "routeSubmodel",
      sinon.fake.resolves({ status: 200 })
    );

    chai
      .request(app)
      .post("/submodels")
      .auth(DATA_MANAGER_USER, DATA_MANAGER_PASSWORD)
      .set("content-type", "application/json")
      .send(submodelsRequest)
      .then((res: any) => {
        //chai.assert(res.body.displayname).to.eql('name'); // assertion expression which will be true if "displayname" equal to "name"
        chai.expect(res.status).to.eql(200); // expression which will be true if response status equal to 200
        sinon.restore();
        done();
      });
  });
  it("Should return a 500 Error if the router could not forward the submodel to the adapter", done => {
    sinon.replace(
      RoutingController,
      "routeSubmodel",
      sinon.fake.rejects({ status: 401 }) //eg. auth error when posting to adapter
    );

    chai
      .request(app)
      .post("/submodels")
      .auth(DATA_MANAGER_USER, DATA_MANAGER_PASSWORD)
      .set("content-type", "application/json")
      .send(submodelsRequest)
      .then((res: any) => {
        chai.expect(res.status).to.eql(500); // expression which will be true if response status equal to 200
        sinon.restore();
        done();
      });
  });
});
