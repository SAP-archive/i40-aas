import sinon from "sinon";
import chaiHttp = require("chai-http");
import Axios, { AxiosError } from "axios";

const dotenv = require("dotenv");
dotenv.config();

var ADAPTER_REGISTRY_ADMIN_USER = process.env.ADAPTER_REGISTRY_ADMIN_USER;
var ADAPTER_REGISTRY_ADMIN_PASSWORD = process.env.ADAPTER_REGISTRY_ADMIN_PASSWORD;

var chai = require("chai");
chai.use(chaiHttp);

const app = require("../src/server").app;

// Then either:
var expect = chai.expect;
const assert = chai.assert;

chai.should();

describe("the adapter service", async function() {


  it("should return a 'Server Up' response on call to /health", () => {
    return chai
      .request(app)
      .get("/health")
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

  it("will give a 422 response if the submodelId or  is missing", () => {
    let adapterRequest = [
      {
	  "adapter": {
	    "url":"http://i40-aas-storage-adapter-mongodb:3100/submodels",
	    "name":"mongo-adapter",
	  "submodelId": "opc-ua-devices",
	  "submodelSemanticId": "opc-ua-devices-semantic"
	  }
      }
    ];

    return chai
      .request(app)
      .post("/adapters")
      .auth(ADAPTER_REGISTRY_ADMIN_USER, ADAPTER_REGISTRY_ADMIN_PASSWORD)
      .set("content-type", "application/json")
      .send(adapterRequest)
      .then(function(res: any) {
	chai.expect(res).to.have.status(422);
      });
  });
/*
  it("will give a 400 response if the input is not parseable", function() {
    return chai
      .request(app)
      .post("/submodels")
      .auth(ADAPTER_REGISTRY_ADMIN_USER, ADAPTER_REGISTRY_ADMIN_PASSWORD)
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
      .auth(ADAPTER_REGISTRY_ADMIN_USER, ADAPTER_REGISTRY_ADMIN_PASSWORD)
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
      .auth(ADAPTER_REGISTRY_ADMIN_USER, ADAPTER_REGISTRY_ADMIN_PASSWORD)
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
      .auth(ADAPTER_REGISTRY_ADMIN_USER, ADAPTER_REGISTRY_ADMIN_PASSWORD)
      .set("content-type", "application/json")
      .send(submodelsRequest)
      .then((res: any) => {
	chai.expect(res.status).to.eql(500); // expression which will be true if response status equal to 200
	sinon.restore();
	done();
      });
  });


*/

});
