import { ConsumeMessage } from "amqplib";
import { AmqpClient } from "../messaging/AmqpClient";
import { IMessageReceiver } from "../messaging/MessageInterpreter";
import { logger } from "../log";
import { Subscription } from "../services/onboarding/messaginginterface/Subscription";

const initializeLogger = require("../log");
let amqpClientSender: AmqpClient;
let amqpClientReceiver: AmqpClient;
let AMQP_URL = process.env.CORE_BROKER_HOST;

let counter = 1;
function start() {
  if (AMQP_URL === undefined) {
    throw new Error("No CORE_BROKER_HOST found in environment");
  }
  amqpClientSender = new AmqpClient(AMQP_URL, "test", "guest", "guest", "");
  amqpClientReceiver = new AmqpClient(
    AMQP_URL,
    "test",
    "guest",
    "guest",
    "listener"
  );
  let clockSet: boolean = false;
  amqpClientReceiver.addSubscriptionData(
    new Subscription(
      "skill.*",
      new (class MyMessageReceiver implements IMessageReceiver {
        receive(msg: string) {
          console.log("amqp client received message:" + msg);
        }
      })()
    )
  );
  amqpClientReceiver.startListening(() => {
    amqpClientSender.setupPublishing(() => {
      if (clockSet) return;
      setInterval(() => {
        try {
          amqpClientSender.publish("skill.x", "ping" + counter++);
        } catch (error) {
          logger.debug("Could not publish:" + error);
        }
      }, 1000);
      clockSet = true;
    });
  });
}

start();
