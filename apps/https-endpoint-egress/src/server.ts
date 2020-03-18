import { AmqpClient } from 'AMQP-Client/lib/src/AMQPClient';
import { BrokerMessageInterpreter } from "./messaging/BrokerMessageInterpreter";
import { logger } from "./utils/log";

// if (process.env.NODE_ENV !== 'production') {
const dotenv = require("dotenv");
dotenv.config();

// Message broker Config
let BROKER_URL: string | undefined = process.env.RABBITMQ_AMQP_HOST;
let RABBITMQ_BROKER_EXCHANGE: string | undefined = process.env.RABBITMQ_BROKER_EXCHANGE;
let RABBITMQ_BROKER_USER: string | undefined = process.env.RABBITMQ_BROKER_USER;
let RABBITMQ_BROKER_PASSWORD: string | undefined = process.env.RABBITMQ_BROKER_PASSWORD;
let BROCKER_QUEUE = "http-egress-queue"; //TODO: here also from env variable??
let RABBITMQ_BROKER_TOPIC_EGRESS : string | undefined = process.env.RABBITMQ_BROKER_TOPIC_EGRESS; //: string | undefined = process.env.RABBITMQ_BROKER_TOPIC_EGRESS;

logger.debug("Env Variable BROKER_URL: " + BROKER_URL);
logger.debug("Env Variable BROKER_EXCHANGE: " + RABBITMQ_BROKER_EXCHANGE);
logger.debug("Env Variable BROKER_TOPIC_EGRESS: " + RABBITMQ_BROKER_TOPIC_EGRESS);


if (
  BROKER_URL &&
  RABBITMQ_BROKER_EXCHANGE &&
  RABBITMQ_BROKER_TOPIC_EGRESS &&
  BROCKER_QUEUE &&
  RABBITMQ_BROKER_USER &&
  RABBITMQ_BROKER_PASSWORD
) {
  var brokerClient = new AmqpClient(
    BROKER_URL,
    RABBITMQ_BROKER_EXCHANGE,
    RABBITMQ_BROKER_USER,
    RABBITMQ_BROKER_PASSWORD,
    BROCKER_QUEUE
  );

  logger.info("HTTP Endpoint - Egress Service Started");

  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    brokerClient
  );

  //start listening for messages at the broker
  messageInterpreter.start(RABBITMQ_BROKER_TOPIC_EGRESS as string);
} else {
  logger.error("One or more env variable not set, service not started");
}
