import sinon from "sinon";
import chaiHttp = require("chai-http");
import { assert } from "chai";
import { WebClient } from "../src/services/data-manager/WebClient/WebClient";
import { AdapterConnector } from "../src/services/data-manager/AdapterConnector";
import { AdapterRegistryConnector } from "../src/services/data-manager/RegistryConnector";
import { RoutingController } from "../src/services/data-manager/RoutingController";
import { AxiosResponse } from "axios";
import { Submodel } from "i40-aas-objects";
import { logger } from "../src/utils/log";
import { IStorageAdapter } from "../src/services/data-manager/interfaces/IStorageAdapter";

const dotenv = require("dotenv");
dotenv.config();

var DATA_MANAGER_USER = process.env.DATA_MANAGER_USER;
var DATA_MANAGER_PASS = process.env.DATA_MANAGER_PASS;

var chai = require("chai");
chai.use(chaiHttp);

const app = require("../src/server").app;

describe("the routing controller ", function() {
  let submodelsRequest: Submodel;
  //read a sample interaction.json to use as body for requests
  before(function(done) {
    var fs = require("fs"),
      path = require("path"),
      filePath = path.join(__dirname, "opcua-submodel-instance.json");

    fs.readFile(filePath, "utf8", function(err: any, fileContents: string) {
      if (err) throw err;
      submodelsRequest = JSON.parse(fileContents);
      done();
    });
  });

  it("should return a 200 OK from the adapter, after posting the submodel to the correct adapter ",async function() {
    let regResponse:IStorageAdapter = {
      url: "http://localhost:3000/submodels",
      adapterId: "storage-adapter-ain",
      name: "SAP-AIN-Adapter",
      submodelId: "opc-ua-devices"
    };

    let adapterConnector: AdapterConnector = new AdapterConnector(
      <WebClient>{}
    );
    let registryConnector: AdapterRegistryConnector = new AdapterRegistryConnector(
      <WebClient>{},
      "a",
      "b",
      "c",
      "d",
      "e",
      "f"
    );
    sinon.replace(
      registryConnector,
      "getAdapterFromRegistry",
      sinon.fake.resolves(regResponse)
    );

    sinon.replace(
      adapterConnector,
      "postSubmoduleToAdapter",
      sinon.fake.resolves({ status: 200 })
    );

    console.log("result " +await registryConnector.getAdapterFromRegistry(submodelsRequest.idShort));

    RoutingController.initController(registryConnector, adapterConnector);
    let actual =await  RoutingController.routeSubmodel(submodelsRequest);

    sinon.assert.match(actual, { status: 200 });
  });
  
  it("should throw an Error if adapterConn is undefined ", async function() {
    let adapterConnector:any = undefined;
    let registryConnector: AdapterRegistryConnector = new AdapterRegistryConnector(
      <WebClient>{},
      "a",
      "b",
      "c",
      "d",
      "e",
      "f"
    );
    RoutingController.initController(registryConnector, adapterConnector);
    let actual =await  RoutingController.routeSubmodel(submodelsRequest);

    sinon.assert.match(actual, { status: 200 });
  });
  
});
