import sinon from "sinon";
import { WebClient } from "../src/services/data-manager/WebClient/WebClient";
import { AdapterConnector } from "../src/services/data-manager/AdapterConnector";
import { AdapterRegistryConnector } from "../src/services/data-manager/RegistryConnector";
import { RoutingController } from "../src/services/data-manager/RoutingController";
import { AxiosResponse } from "axios";
import { Submodel, IdTypeEnum } from "i40-aas-objects";
import { logger } from "../src/utils/log";
import { IStorageAdapter } from "../src/services/data-manager/interfaces/IStorageAdapter";
import { fail } from "assert";
import Axios from "axios";
import ChaiPluginAssertType = require('chai-asserttype-extra');
import { expect } from "chai";
const chai = ChaiPluginAssertType.install();



const dotenv = require("dotenv");
dotenv.config();

var DATA_MANAGER_USER = process.env.DATA_MANAGER_USER;
var DATA_MANAGER_PASS = process.env.DATA_MANAGER_PASS;


const app = require("../src/server").app;

describe("the routing controller ", function() {
  let submodelsRequest: Submodel[];
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

  it("should return a 200 OK from the adapter, after posting the submodel to the correct adapter ", async function() {
    let regResponse: IStorageAdapter = {
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
      new URL("http://www.foobar.com/foo"),
      "b",
      "c"
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

    console.log(
      "result " +
  (await registryConnector.getAdapterFromRegistry("submodelid",
    submodelsRequest[0].idShort
        ))
    );

    RoutingController.initController(registryConnector, adapterConnector);
    let actual = await RoutingController.routeSubmodel(submodelsRequest);

    sinon.assert.match(actual, [{ status: 200 }]);
  });

  it("should throw an Error if adapterConn is undefined ", async function() {
    let adapterConnector: any = undefined;
    let registryConnector: AdapterRegistryConnector = new AdapterRegistryConnector(
      <WebClient>{},
      new URL("http://www.foobar.com/foo"),
      "b",
      "c"
    );
    RoutingController.initController(registryConnector, adapterConnector);

    try {
      var result = await RoutingController.routeSubmodel(submodelsRequest);
      fail("Error should have been thrown");
    } catch (err) {
      logger.error("[Test] Error correctly thrown");
    }
  });
});

describe("the registry connector ", function() {
  function isStorageAdapter(obj: any): obj is IStorageAdapter {
    if((obj as IStorageAdapter).url){
      return true
    }
    return false
  }
  it("should get an IStorageAdapter from the adapter-registry ", async function() {
    let fakeGet = sinon.fake.resolves({
      status: 200,
      data:
        {
            url: "http://localhost:3000/submodels",
            adapterId: "storage-adapter-ain",
            name: "SAP-AIN-Adapter",
            submodelId: "opc-ua-devices"
        }

    });
    sinon.replace(Axios,"get",fakeGet);
    let registryConnector: AdapterRegistryConnector = new AdapterRegistryConnector(
    new WebClient(),
      new URL("http://www.foobar.com/foo"),
      "b",
      "c"
    );
    let result: IStorageAdapter  = await registryConnector.getAdapterFromRegistry("submodelId","fooIdShort");
console.log(result);
    expect( isStorageAdapter(result),"should be an adapter object").to.be.true;

    sinon.restore();
    });

  it("should throw an Error if the registry returns an non-valid Storage adapter ", async function() {
    let fakeGet = sinon.fake.resolves({
      status: 200,
      data:
        {
        //empty adapter was returned (eg. when no entry for this submodel exists in registry)
        }

    });
    sinon.replace(Axios,"get",fakeGet);
    let registryConnector: AdapterRegistryConnector = new AdapterRegistryConnector(
    new WebClient(),
      new URL("http://www.foobar.com/foo"),
      "b",
      "c"
    );
    try{
      await registryConnector.getAdapterFromRegistry("submodelId","fooIdShort");
      fail(); //this should not be called when error thrown
    }
    catch{
logger.error("[Test] Registry returned no adapter");
    }
    sinon.restore();
  });

});

describe("the adapter connector ", function() {

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

  let adapter: IStorageAdapter = {
    url: "http://localhost:3000/submodels",
    adapterId: "storage-adapter-ain",
    name: "SAP-AIN-Adapter",
    submodelId: "opc-ua-devices"
  };


it(" Should post a submodel to a storage adapter service", async function(){

  let fakePost = sinon.fake.resolves({
    status: 200,
    data:       {
      }
  });
  let adapterConnector: AdapterConnector = new AdapterConnector(
    new WebClient()
  );
  sinon.replace(Axios,"post",fakePost);

let result = await adapterConnector.postSubmoduleToAdapter(submodelsRequest,adapter);

sinon.assert.match(result, { status: 200 });
sinon.restore();

});

});
