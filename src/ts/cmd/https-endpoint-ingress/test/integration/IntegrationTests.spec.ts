import { AmqpClient } from "../../src/services/aas-router/messaging/AmqpClient";
import { logger } from "../../src/utils/log";
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
describe("AmpqClient", function() {
  var amqpClientSender: AmqpClient;
  this.beforeEach(function() {
    const dotenv = require("dotenv");
    dotenv.config();
    if (
      process.env.AMQP_URL &&
      process.env.BROKER_EXCHANGE &&
      process.env.BROKER_USER &&
      process.env.BROKER_PASSWORD
    ) {
      amqpClientSender = new AmqpClient(
        process.env.AMQP_URL,
        process.env.BROKER_EXCHANGE,
        process.env.BROKER_USER,
        process.env.BROKER_PASSWORD
      );
    } else {
      throw new Error("No AMQP_URL found in environment");
    }
  });
  this.afterEach(async function() {
    if (amqpClientSender) amqpClientSender.cleanup();
  });

  it("can connect to the broker",  function(done) {


    try {
      var connection =  amqpClientSender.setupPublishing(() => {
        var connect =  amqpClientSender.isConnected();
      logger.debug("Test 1 done " + connect);
      chai.assert.equal(connect, true);
      done();
      });

  } catch(err) {
      done(err);
  }

  });

  it("reconnects if first connect failed",  function(done) {
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
