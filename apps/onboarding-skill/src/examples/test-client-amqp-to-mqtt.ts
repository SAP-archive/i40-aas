import { AmqpClient } from "../messaging/AmqpClient";
import { SapMqttClient } from "./SapMqttClient";
import { IMessageReceiver } from "../messaging/MessageInterpreter";
import { logger } from "../log";
import { IMessageBrokerClient } from "../services/onboarding/messaginginterface/IMessageBrokerClient";
import { Subscription } from "../services/onboarding/messaginginterface/Subscription";

const initializeLogger = require("../log");
let sender: IMessageBrokerClient;
let receiver: IMessageBrokerClient;
let AMQP_URL = process.env.RABBITMQ_AMQP_HOST;

let counter = 1;
function start() {
  if (AMQP_URL === undefined) {
    throw new Error("No AMQP_URL found in environment");
  }

  receiver = new SapMqttClient(AMQP_URL, "guest", "guest");

  sender = new AmqpClient(AMQP_URL, "test", "guest", "guest", "", true);
  let clockSet: boolean = false;
  receiver.addSubscriptionData(
    new Subscription(
      "skill/x",
      new (class MyMessageReceiver implements IMessageReceiver {
        receive(msg: string) {
          console.log("mqtt client received message:" + msg);
        }
      })()
    )
  );
  receiver.startListening(() => {
    sender.setupPublishing(() => {
      if (clockSet) return;
      setInterval(() => {
        try {
          sender.publish("skill.x", "ping" + counter++);
        } catch (error) {
          logger.debug("Could not publish:" + error);
        }
      }, 1000);
      clockSet = true;
    });
  });
}

start();
