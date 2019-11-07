import { WebClient } from "../../src/WebClient/WebClient";
import sinon from "sinon";
import { BrokerMessageInterpreter } from "../../src/messaging/BrokerMessageInterpreter";
import { AmqpClient } from "../../src/messaging/AmqpClient";
import { ConsumeMessage } from "amqplib";
import { InteractionMessage } from "i40-aas-objects";
import { logger } from "../../src/utils/log";
import { Subscription } from "../../src/messaging/interfaces/Subscription";
import { RegistryConnector } from "../../src/messaging/RegistryConnector";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Then either:
var expect = chai.expect;
// or:
//var assert = chai.assert;
// or:
chai.should();


function mockSetup() {}

describe("validation process", function() {
  before(() => {});
  after(() => {});
  beforeEach(async () => {});

  afterEach(async () => {
    sinon.restore();
  });


/*
  it("forwards the event to the state machine if it is parsable and contains senderid, sender role, message type, and conversation Id", async function() {
    let message = <InteractionMessage>{
      frame: {
        type: "publishInstance",
        messageId: "messageId",
        receiver: {
          identification: {
            id: "receiver-id",
            idType: "idType"
          },
          role: {
            name: "central-asset-repository"
          }
        },
        semanticProtocol: "semprot",
        sender: {
          identification: {
            id: "sender-id",
            idType: "idType"
          },
          role: {
            name: "operator"
          }
        },
        conversationId: "conversationId"
      },
      interactionElements: [{}]
    };
    let messageDispatcher: MessageDispatcher = new MessageDispatcher(
      <IMessageSender>{},
      <WebClient>{},
      "data-manager"
    );

    let skill: AssetRepositoryOnboardingSkill = new AssetRepositoryOnboardingSkill(
      messageDispatcher,
      makeFakeDbClient()
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

 

  it("handles the situation where the receiver id or role are missing", async function() {
    let message = <InteractionMessage>{
      frame: {
        type: "publishInstance",
        messageId: "messageId",
        receiver: {
          identification: {
            id: "receiver-id",
            idType: "idType"
          },
          role: {
            name: "central-asset-repository"
          }
        },
        semanticProtocol: "semprot",
        sender: {
          identification: {
            idType: "idType"
          }
        },
        conversationId: "conversationId"
      },
      interactionElements: [{}]
    };
    let messageDispatcher: MessageDispatcher = new MessageDispatcher(
      <IMessageSender>{},
      <WebClient>{},
      "data-manager"
    );

    let fakeReplyError = sinon.fake();
    sinon.replace(messageDispatcher, "replyError", fakeReplyError);
    let skill: AssetRepositoryOnboardingSkill = new AssetRepositoryOnboardingSkill(
      messageDispatcher,
      makeFakeDbClient()
    );
    let messageInterpreter: MessageInterpreter = new MessageInterpreter(
      skill,
      new AmqpClient("a", "b", "c", "d", "")
    );
    let spy = sinon.spy(logger, "error");
    messageInterpreter.receive(JSON.stringify(message));
    sinon.assert.notCalled(fakeReplyError);
    sinon.assert.called(spy);
  });
*/
  it("sets up a subscription and starts listening", async function() {
    let messageDispatcher: RegistryConnector = new RegistryConnector(
      "a","b","c","d"
    );

    let fakeapplyEvent = sinon.fake();
    //sinon.replace(skill, "applyEvent", fakeapplyEvent);

    let amqpClient = new AmqpClient("a", "b", "c", "d", "");
    let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
      messageDispatcher,
      amqpClient
    );

    let fakeAddSubscriptionData = sinon.fake();
    let fakeStartListening = sinon.fake();

    sinon.replace(amqpClient, "addSubscriptionData", fakeAddSubscriptionData);
    sinon.replace(amqpClient, "startListening", fakeStartListening);
    messageInterpreter.start(["foo_topic"]);
    sinon.assert.calledWith(
      fakeAddSubscriptionData,
      sinon.match.has("topic", "x")
    );
    sinon.assert.calledOnce(fakeStartListening);
  });
});
