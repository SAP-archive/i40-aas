import Axios from "axios";
import { expect } from "chai";
import sinon from "sinon";




describe("the BrokerMessageInterpreter ", function () {

  var brokerMessage;
  //read a sample broker message
  before(function (done) {
    var fs = require("fs"),
      path = require("path"),
      filePath = path.join(__dirname, "SampleResolverMessage.json");

    fs.readFile(filePath, "utf8", function (err: any, fileContents: string) {
      if (err) throw err;
      brokerMessage = JSON.parse(fileContents);
      console.log('BrokerMsg '+brokerMessage);

      done();
    });
  });

  it(" should POST the message to the Receiver AAS ", async function () {


  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    brokerClient
  );


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

    RoutingController.initController(registryConnector, adapterConnector);
    let actual = await RoutingController.routeSubmodel(submodelsRequest);

    sinon.assert.match(actual, [{ status: 200 }]);
  });

  it("forwards the message to the AASConnector if it is parsable and contains ReceiverURL", async function() {
    let message = brokerMessage;
    let messageDispatcher: MessageDispatcher = new MessageDispatcher(
      <IMessageSender>{},
      <WebClient>{},
      "data-manager"
    );

    

    let fakeapplyEvent = sinon.fake();
    sinon.replace(skill, "applyEvent", fakeapplyEvent);

    let messageInterpreter: MessageInterpreter = new MessageInterpreter(
      skill,
      new AmqpClient("a", "b", "c", "d", "")
    );
    messageInterpreter.receive(JSON.stringify(message));
    sinon.assert.calledOnce(fakeapplyEvent);
  });



});
