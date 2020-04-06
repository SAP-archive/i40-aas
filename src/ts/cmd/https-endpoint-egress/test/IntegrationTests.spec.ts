import { AmqpClient } from "../src/messaging/AmqpClient";
import { logger } from "../src/utils/log";
import sinon from "sinon";
// import sinon from "sinon";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

// Then either:
var expect = chai.expect;
// or:
//var assert = chai.assert;
// or:
chai.should();

//TODO: this test sometimes does not work
describe("AmpqClient", function () {
  var amqpClientSender: AmqpClient;
  this.beforeEach(function () {
    const dotenv = require("dotenv");
    dotenv.config();
    if (
      process.env.CORE_BROKER_HOST &&
      process.env.CORE_BROKER_PORT &&
      process.env.CORE_EGRESS_EXCHANGE &&
      process.env.CORE_EGRESS_USER &&
      process.env.CORE_EGRESS_PASSWORD
    ) {
      amqpClientSender = new AmqpClient(
        process.env.CORE_BROKER_HOST,
        process.env.CORE_BROKER_PORT,
        process.env.CORE_EGRESS_EXCHANGE,
        process.env.CORE_EGRESS_USER,
        process.env.CORE_EGRESS_PASSWORD,
        "sampleListenerId"
      );
    } else {
      throw new Error("No AMQP_URL found in environment");
    }
  });
  this.afterEach(async function () {
    if (amqpClientSender) AmqpClient.cleanup();
  });


  it("can send and receive messages from the broker *if a message broker has been started*", function(done) {
    if (AMQP_URL === undefined) {
      throw new Error("No CORE_BROKER_HOST found in environment");
    }
    let exchange = "test1";
    amqpClientSender = new AmqpClient(AMQP_URL, exchange, "guest", "guest", "");
    let listenerId = "listener1";
    amqpClientReceiver = new AmqpClient(
      AMQP_URL,
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



  it("reconnects if first connect failed", function (done) {
    let fakeConnect = sinon.fake.yields(
      new Error("Simulating disconnection"),
      null
    );

    if (process.env.AMQP_URL === undefined) {
      throw new Error("No AMQP_URL found in environment");
    }
    let exchange = "test2";

    sinon.replace(amqpClientSender, "connectToBroker", fakeConnect);

    sinon.restore();
    logger.debug("restored mock of broker connect");

    amqpClientSender.setupPublishing(async () => {
      amqpClientSender.publish("test2.x", "ping");

      while (!amqpClientSender.isConnected()) {
        await AmqpClient.sleep(500);
        logger.debug("Test 2 done");
      }
      chai.assert.equal(amqpClientSender.isConnected(), true);
      done();
    });

  });
});
