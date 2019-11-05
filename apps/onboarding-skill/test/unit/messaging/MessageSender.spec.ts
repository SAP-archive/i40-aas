import sinon from "sinon";
import fs from "fs";
import { MessageSender } from "../../../src/messaging/MessageSender";
import { AmqpClient } from "../../../src/messaging/AmqpClient";
import { InteractionMessage } from "i40-aas-objects";

describe("replyTo", function() {
  this.beforeEach(function() {});
  this.afterEach(function() {
    sinon.restore();
  });
  //TODO: refactor to not test so many things in one test
  it("inverts the sender and receiver when creating the reply frame of a message, adding own sender information", function() {
    let message: InteractionMessage = JSON.parse(
      fs.readFileSync(process.cwd() + "/test/interaction_sample.json", "utf8")
    );
    let HTTP_ENDPOINT_ROUTING_KEY = "http.client";
    let BROCKER_URL = "a.b.c";
    let BROKER_EXCHANGE = "amq.topic";
    let BROKER_USER = "guest";
    let BROKER_PASSWORD = "guest";
    let MY_URI = "sap.com/aas/skills/onboarding/CentralAssetRepository";
    let MY_ROLE = "CentralAssetRepository";

    let amqpClient: AmqpClient = new AmqpClient(
      BROCKER_URL,
      BROKER_EXCHANGE,
      BROKER_USER,
      BROKER_PASSWORD,
      ""
    );
    let messageSender: MessageSender = new MessageSender(
      amqpClient,
      {
        identification: {
          id: MY_URI,
          idType: "URI"
        },
        role: {
          name: MY_ROLE
        }
      },
      HTTP_ENDPOINT_ROUTING_KEY
    );
    let fakePublish = sinon.fake();
    sinon.replace(amqpClient, "publish", fakePublish);
    messageSender.replyTo(message.frame, "error", []);
    sinon.assert.calledWith(
      fakePublish,
      sinon.match.any,
      sinon.match(
        '"receiver":{"identification":{"id":"operator.com/aas","idType":"URI"},"role":{"name":"Operator"}}'
      )
    );
    sinon.assert.calledWith(
      fakePublish,
      sinon.match.any,
      sinon.match('"interactionElements":[]')
    );
    sinon.assert.calledWith(
      fakePublish,
      sinon.match.any,
      sinon.match(
        '"sender":{"identification":{"id":"' +
          MY_URI +
          '","idType":"URI"},"role":{"name":"' +
          MY_ROLE +
          '"}}'
      )
    );
    sinon.assert.calledWith(
      fakePublish,
      sinon.match.any,
      sinon.match('"conversationId":"Foo_Conv_ID_000"')
    );
  });
});

describe("start", function() {
  this.beforeEach(function() {});
  this.afterEach(function() {
    sinon.restore();
  });
  //TODO: refactor to not test so many things in one test
  it("sets up publishing and calls back", function() {
    let HTTP_ENDPOINT_ROUTING_KEY = "http.client";
    let BROCKER_URL = "a.b.c";
    let BROKER_EXCHANGE = "amq.topic";
    let BROKER_USER = "guest";
    let BROKER_PASSWORD = "guest";
    let MY_URI = "sap.com/aas/skills/onboarding/CentralAssetRepository";
    let MY_ROLE = "CentralAssetRepository";

    let amqpClient: AmqpClient = new AmqpClient(
      BROCKER_URL,
      BROKER_EXCHANGE,
      BROKER_USER,
      BROKER_PASSWORD,
      ""
    );
    let fake = sinon.fake();
    let fakeSetupPublishing = sinon.fake();
    sinon.replace(amqpClient, "setupPublishing", fakeSetupPublishing);
    let messageSender: MessageSender = new MessageSender(
      amqpClient,
      {
        identification: {
          id: MY_URI,
          idType: "URI"
        },
        role: {
          name: MY_ROLE
        }
      },
      HTTP_ENDPOINT_ROUTING_KEY
    );
    messageSender.start(fake);
    sinon.assert.calledOnce(fakeSetupPublishing);
    sinon.assert.calledWith(fakeSetupPublishing, fake);
  });
});
