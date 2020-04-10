import Axios from "axios";
import { BrokerMessageInterpreter } from "../../src/messaging/BrokerMessageInterpreter";
import { doesNotReject } from "assert";
import { logger } from "../../src/utils/log";
import sinon from "sinon";
import { IResolverMessage } from "../../src/messaging/interfaces/IResolverMessage";
import { AmqpClient, Subscription } from 'AMQP-Client/lib/AmqpClient';

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Then either:
var expect = chai.expect;
// or:
//var assert = chai.assert;
// or:
chai.should();

describe('the BrokerMessageInterpreter ', function () {
  var brokerMessage: string;
  //read a sample broker message
  before(function (done) {
    var fs = require('fs'),
      path = require('path'),
      filePath = path.join(__dirname, 'SampleResolverMessage.json');

    fs.readFile(filePath, 'utf8', function (err: any, fileContents: string) {
      if (err) throw err;
      brokerMessage = JSON.parse(fileContents);
      console.log('BrokerMsg ' + brokerMessage);

      done();
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('forwards the message to the AASConnector if it is parsable and contains ReceiverURL', async function () {
    let message = JSON.stringify(brokerMessage);
    console.log('BrokerMsg ' + message);
    let spy = sinon.spy(logger, 'error');

    let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(new AmqpClient("a", "b", "c", "d", "e", "f")
    );
    let fakeAASConnectorCall = sinon.fake();
    sinon.replace(
      messageInterpreter.aasConn,
      'sendInteractionReplyToAAS',
      fakeAASConnectorCall
    );

    messageInterpreter.receive(message);
    sinon.assert.calledOnce(fakeAASConnectorCall);

    sinon.assert.notCalled(spy);
  });

  it("logs an error if the message is non parsable or empty", async function () {
    let message = "";
    let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(new AmqpClient("a", "b", "c", "d", "e", "f")
    );
    let spy = sinon.spy(logger, 'error');

    let fakeAASConnectorCall = sinon.fake();
    sinon.replace(
      messageInterpreter.aasConn,
      'sendInteractionReplyToAAS',
      fakeAASConnectorCall
    );

    messageInterpreter.receive(message);
    //check if error logged

    sinon.assert.called(spy);
    //the message should not be dispatched
    sinon.assert.notCalled(fakeAASConnectorCall);
  });

  it('logs an error if the message does contain a ReceiverURL', async function () {
    //remove the receiverURL from the message
    let resolverMessage:
      | IResolverMessage
      | undefined = (brokerMessage as unknown) as IResolverMessage;
    resolverMessage.ReceiverURL = '';
    let receiverURL = resolverMessage.ReceiverURL;
    console.log('ReceiverURL ' + receiverURL);
    let spy = sinon.spy(logger, 'error');

    let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(new AmqpClient("a", "b", "c", "d", "e", "f")
    );
    let fakeAASConnectorCall = sinon.fake();
    sinon.replace(
      messageInterpreter.aasConn,
      'sendInteractionReplyToAAS',
      fakeAASConnectorCall
    );

    messageInterpreter.receive(JSON.stringify(resolverMessage));
    //check if error logged
    sinon.assert.called(spy);
    //the message should not be dispatched
    sinon.assert.notCalled(fakeAASConnectorCall);
  });

  it("logs Success when it receives a 200 response from the AAS if the POST was successfull", async function () {
    let resolverMessage: IResolverMessage | undefined = brokerMessage as unknown as IResolverMessage;

    let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(new AmqpClient("a", "b", "c", "d", "e", "f")
    );

    let fakePost = sinon.fake.resolves({
      status: 200,
      data: {},
    });

    sinon.replace(Axios, 'post', fakePost);

    let result = await messageInterpreter.aasConn.sendInteractionReplyToAAS(
      resolverMessage.ReceiverURL,
      resolverMessage.EgressPayload
    );

    sinon.assert.match(result, { status: 200 });
  });

  it('logs Error when it receives a non-200 response from the AAS if the POST was successfull', async function () {
    let message = JSON.stringify(brokerMessage);

    let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(new AmqpClient("a", "b", "c", "d", "e", "f")
    );
    let spy = sinon.spy(logger, 'error');

    let fakePost = sinon.fake.resolves({
      status: 404,
      data: {},
    });

    sinon.replace(Axios, 'post', fakePost);

    let result = await messageInterpreter.aasConn.sendInteractionReplyToAAS(
      'ReceiverURL',
      'resolverMessage.EgressPayload'
    );

    sinon.assert.match(result, { status: 404 });

    messageInterpreter.receive(message);

    //check if error logged
    sinon.assert.called(spy);
  });
});
