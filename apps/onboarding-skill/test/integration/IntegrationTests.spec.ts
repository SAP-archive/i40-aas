import { AmqpClient } from "../../src/messaging/AmqpClient";
import { IMessageReceiver } from "../../src/messaging/MessageInterpreter";
import { Subscription } from "../../src/services/onboarding/messaginginterface/Subscription";
import { SapMqttClient } from "../../src/examples/SapMqttClient";
import { logger } from "../../src/log";
import sinon from "sinon";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Then either:
var expect = chai.expect;
// or:
//var assert = chai.assert;
// or:
chai.should();

//If these tests do not work reliably some of these can be converted into useful unit tests

describe("AmpqClient", function() {
  let amqpClientSender: AmqpClient;
  let amqpClientReceiver: AmqpClient;
  this.beforeEach(function() {});
  this.afterEach(async function() {
    if (amqpClientSender) amqpClientSender.cleanup();
    if (amqpClientReceiver) amqpClientReceiver.cleanup();
  });

  this.beforeEach(function() {});
  this.afterEach(function() {
    sinon.restore();
  });

  it("can send and receive messages from the broker *if a message broker has been started*", function(done) {
    if (process.env.AMQP_URL === undefined) {
      throw new Error("No AMQP_URL found in environment");
    }
    let exchange = "test1";
    amqpClientSender = new AmqpClient(
      process.env.AMQP_URL,
      exchange,
      "guest",
      "guest",
      ""
    );
    let listenerId = "listener1";
    amqpClientReceiver = new AmqpClient(
      process.env.AMQP_URL,
      exchange,
      "guest",
      "guest",
      listenerId
    );
    amqpClientReceiver.addSubscriptionData(
      new Subscription(
        "test1.*",
        new (class MyMessageReceiver implements IMessageReceiver {
          receive(cm: string) {
            logger.debug(listenerId + " got message:" + cm);
            expect(cm).to.include("ping");
            logger.debug("Test 1 done");
            done();
          }
        })()
      )
    );
    amqpClientReceiver.startListening(() => {
      amqpClientSender.setupPublishing(() => {
        try {
          amqpClientSender.publish("test1.x", "ping" + Date.now());
        } catch (error) {
          logger.debug("Could not publish:" + error);
        }
      });
    });
  });

  it("can  receive mqtt messages from the broker *if a message broker has been started*", function(done) {
    if (process.env.AMQP_URL === undefined) {
      throw new Error("No AMQP_URL found in environment");
    }

    let mqttSender = new SapMqttClient(process.env.AMQP_URL, "guest", "guest");

    let listenerId = "listener1b";
    amqpClientReceiver = new AmqpClient(
      process.env.AMQP_URL,
      "amq.topic",
      "guest",
      "guest",
      listenerId,
      true
    );

    amqpClientReceiver.addSubscriptionData(
      new Subscription(
        "test1b.*",
        new (class MyMessageReceiver implements IMessageReceiver {
          receive(cm: string) {
            logger.debug(listenerId + " got message:" + cm);
            expect(cm).to.include("ping");
            logger.debug("Test 1b done");
            done();
          }
        })()
      )
    );

    amqpClientReceiver.startListening(() => {
      mqttSender.setupPublishing(() => {
        mqttSender.publish("test1b.x", "ping" + Date.now());
      });
    });
  });

  it("can send mqtt messages to the broker *if a message broker has been started*", function(done) {
    if (process.env.AMQP_URL === undefined) {
      throw new Error("No AMQP_URL found in environment");
    }

    let mqttReceiver = new SapMqttClient(
      process.env.AMQP_URL,
      "guest",
      "guest"
    );

    amqpClientSender = new AmqpClient(
      process.env.AMQP_URL,
      "test",
      "guest",
      "guest",
      "",
      true
    );

    mqttReceiver.addSubscriptionData(
      new Subscription(
        "test1c/x",
        new (class MyMessageReceiver implements IMessageReceiver {
          receive(cm: string) {
            logger.debug("mqtt listener got message:" + cm);
            expect(cm).to.include("ping");
            logger.debug("Test 1c done");
            done();
          }
        })()
      )
    );

    mqttReceiver.startListening(() => {
      amqpClientSender.setupPublishing(() => {
        try {
          amqpClientSender.publish("test1c.x", "ping" + Date.now());
        } catch (error) {
          logger.debug("Could not publish:" + error);
        }
      });
    });
  });

  it("reconnects if first connect failed", function(done) {
    let fakeConnect = sinon.fake.yields(
      new Error("Simulating disconnection"),
      null
    );

    if (process.env.AMQP_URL === undefined) {
      throw new Error("No AMQP_URL found in environment");
    }
    let exchange = "test2";
    amqpClientSender = new AmqpClient(
      process.env.AMQP_URL,
      exchange,
      "guest",
      "guest",
      ""
    );
    let listenerId = "listener2";
    amqpClientReceiver = new AmqpClient(
      process.env.AMQP_URL,
      exchange,
      "guest",
      "guest",
      listenerId,
      false,
      200
    );

    sinon.replace(amqpClientReceiver, "connectToBroker", fakeConnect);

    setTimeout(() => {
      sinon.restore();
      logger.debug("restored mock");
    }, 300);

    amqpClientReceiver.addSubscriptionData(
      new Subscription(
        "test2.*",
        new (class MyMessageReceiver implements IMessageReceiver {
          receive(cm: string) {
            testRunning = false;
            logger.debug(listenerId + " got message:" + cm);
            expect(cm).to.include("ping");
            sinon.assert.called(fakeConnect);
            logger.debug("Test 2 done");
            done();
          }
        })()
      )
    );
    let testRunning: boolean = true;
    amqpClientReceiver.startListening(() => {
      amqpClientSender.setupPublishing(async () => {
        while (testRunning) {
          try {
            amqpClientSender.publish("test2.x", "ping");
          } catch (error) {
            logger.debug("Could not publish:" + error);
          }
          await AmqpClient.sleep(50);
        }
      });
    });
  });

  it("recovers from a dropped connection as a receiver", function(done) {
    if (process.env.AMQP_URL === undefined) {
      throw new Error("No AMQP_URL found in environment");
    }
    let exchange = "test3";
    amqpClientSender = new AmqpClient(
      process.env.AMQP_URL,
      exchange,
      "guest",
      "guest",
      ""
    );
    let listenerId = "listener3";
    amqpClientReceiver = new AmqpClient(
      process.env.AMQP_URL,
      exchange,
      "guest",
      "guest",
      listenerId,
      false,
      50
    );
    let counter: number = 0;
    let connectionKilled: boolean = false;
    let fakeConnect = sinon.fake.yields(
      new Error("Simulating connection problem"),
      null
    );
    setTimeout(() => {
      sinon.replace(amqpClientReceiver, "connectToBroker", fakeConnect);
      amqpClientReceiver.killConnection(() => (connectionKilled = true));
      logger.debug("killed connection");
      //come back after 300ms
      setTimeout(() => {
        sinon.restore();
        logger.debug("restored mock");
      }, 300);
    }, 400);

    amqpClientReceiver.addSubscriptionData(
      new Subscription(
        "test3.*",
        new (class MyMessageReceiver implements IMessageReceiver {
          receive(numberAsString: string) {
            logger.debug(listenerId + " got message:" + numberAsString);
            if (!connectionKilled) return;
            if (testRunning) {
              testRunning = false;
              logger.debug("Test 3 done");
              done();
            }
          }
        })()
      )
    );

    let testRunning: boolean = true;
    amqpClientReceiver.startListening(() => {
      amqpClientSender.setupPublishing(async () => {
        logger.debug("Listening for messages");
        while (testRunning) {
          try {
            amqpClientSender.publish("test3.x", String(counter++));
          } catch (error) {
            logger.debug("Could not publish:" + error);
          }
          await AmqpClient.sleep(50);
        }
      });
    });
  });
});
