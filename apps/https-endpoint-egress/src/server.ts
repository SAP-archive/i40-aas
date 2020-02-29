import { AmqpClient } from "./messaging/AMQPClient";
import { BrokerMessageInterpreter } from "./messaging/BrokerMessageInterpreter";
import { logger } from "./utils/log";
import { RegistryConnector } from "./messaging/RegistryConnector";

// if (process.env.NODE_ENV !== 'production') {
const dotenv = require("dotenv");
dotenv.config();

// Message broker Config
let RABBITMQ_AMQP_HOST: string | undefined = process.env.RABBITMQ_AMQP_HOST;
let RABBITMQ_AMQP_PORT: string | undefined = process.env.RABBITMQ_AMQP_PORT;
let RABBITMQ_BROKER_EXCHANGE: string | undefined = process.env.RABBITMQ_EGRESS_EXCHANGE;
let RABBITMQ_BROKER_USER: string | undefined = process.env.RABBITMQ_EGRESS_USER;
let RABBITMQ_BROKER_PASSWORD: string | undefined = process.env.RABBITMQ_EGRESS_PASSWORD;
let BROKER_QUEUE: string | undefined = process.env.HTTPS_ENDPOINT_EGRESS_AMQP_QUEUE;
let RABBITMQ_BROKER_TOPIC_EGRESS: string | undefined = process.env.HTTPS_ENDPOINT_EGRESS_AMQP_QUEUE;

logger.debug("Env Variable BROKER_URL: " + RABBITMQ_AMQP_HOST);
logger.debug("Env Variable BROKER_EXCHANGE: " + RABBITMQ_BROKER_EXCHANGE);
logger.debug("Env Variable BROKER_TOPIC_EGRESS: " + RABBITMQ_BROKER_TOPIC_EGRESS);


if (
  RABBITMQ_AMQP_HOST &&
  RABBITMQ_AMQP_PORT &&
  RABBITMQ_BROKER_EXCHANGE &&
  RABBITMQ_BROKER_TOPIC_EGRESS &&
  BROKER_QUEUE &&
  RABBITMQ_BROKER_USER &&
  RABBITMQ_BROKER_PASSWORD
) {
  var brokerClient = new AmqpClient(
    RABBITMQ_AMQP_HOST,
    RABBITMQ_AMQP_PORT,
    RABBITMQ_BROKER_EXCHANGE,
    RABBITMQ_BROKER_USER,
    RABBITMQ_BROKER_PASSWORD,
    BROKER_QUEUE
  );

  logger.info("HTTP Endpoint - Egress Service Started");

  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    brokerClient
  );

  //start listening for messages at the broker
  messageInterpreter.start([RABBITMQ_BROKER_TOPIC_EGRESS as string]);
} else {
  logger.error("One or more env variable not set, service not started");
}
