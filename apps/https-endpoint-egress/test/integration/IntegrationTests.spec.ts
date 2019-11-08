import { AmqpClient } from "../../src/messaging/AMQPClient";
import { logger } from "../../src/utils/log";
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

describe("AmpqClient", function() {
  let amqpClientSender: AmqpClient;
  let amqpClientReceiver: AmqpClient;
  this.beforeEach(function() {
    const dotenv = require("dotenv");
    dotenv.config();
  });
  this.afterEach(async function() {
    if (amqpClientSender) amqpClientSender.cleanup();
    if (amqpClientReceiver) amqpClientReceiver.cleanup();
  });

  this.beforeEach(function() {});
  this.afterEach(function() {
    sinon.restore();
  });

  it("can send and receive messages from the broker *if a message broker has been started*", function(done) {
    if (
      !process.env.AMQP_URL ||
      !process.env.BROKER_EXCHANGE ||
      !process.env.BROKER_USER ||
      !process.env.BROKER_PASSWORD
    ) {
      throw new Error("No AMQP_URL found in environment");
    }
    let exchange = "test1";
    amqpClientSender = new AmqpClient(
      process.env.AMQP_URL,
      process.env.BROKER_EXCHANGE,
      process.env.BROKER_USER,
      process.env.BROKER_PASSWORD
    );

    amqpClientSender.connect();
    amqpClientSender.publish("test1.x", "ping" + Date.now());
  });

});
