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
let RABBITMQ_BROKER_EXCHANGE: string | undefined = process.env.RABBITMQ_BROKER_EXCHANGE;
let RABBITMQ_BROKER_USER: string | undefined = process.env.RABBITMQ_BROKER_USER;
let RABBITMQ_BROKER_PASSWORD: string | undefined = process.env.RABBITMQ_BROKER_PASSWORD;
let BROKER_QUEUE = "endpoint-egress"; //TODO: here also from env variable??
let RABBITMQ_BROKER_TOPIC_EGRESS: string | undefined = process.env.RABBITMQ_BROKER_TOPIC_EGRESS;

//Endpoint-registry Config
let ENDPOINT_REGISTRY_PROTOCOL: string | undefined = process.env.ENDPOINT_REGISTRY_PROTOCOL;
let ENDPOINT_REGISTRY_HOST: string | undefined = process.env.ENDPOINT_REGISTRY_HOST;
let ENDPOINT_REGISTRY_PORT: string | undefined = process.env.ENDPOINT_REGISTRY_PORT;
let ENDPOINT_REGISTRY_URL_SUFFIX: string | undefined = process.env.ENDPOINT_REGISTRY_URL_SUFFIX;
let ENDPOINT_REGISTRY_ADMIN_USER: string | undefined = process.env.ENDPOINT_REGISTRY_ADMIN_USER;
let ENDPOINT_REGISTRY_ADMIN_PASSWORD: string | undefined =
  process.env.ENDPOINT_REGISTRY_ADMIN_PASSWORD;

logger.debug("Env Variable BROKER_URL: " + RABBITMQ_AMQP_HOST);
logger.debug("Env Variable BROKER_EXCHANGE: " + RABBITMQ_BROKER_EXCHANGE);
logger.debug("Env Variable BROKER_TOPIC_EGRESS: " + RABBITMQ_BROKER_TOPIC_EGRESS);
logger.debug("Env Variable REGISTRY_URL: " + ENDPOINT_REGISTRY_PROTOCOL);
logger.debug(
  "Env Variable REGISTRY_URL_GET_SUFFIX: " + ENDPOINT_REGISTRY_URL_SUFFIX
);

if (
  RABBITMQ_AMQP_HOST &&
  RABBITMQ_AMQP_PORT&&
  RABBITMQ_BROKER_EXCHANGE &&
  RABBITMQ_BROKER_TOPIC_EGRESS &&
  BROKER_QUEUE&&
  ENDPOINT_REGISTRY_PROTOCOL &&
  ENDPOINT_REGISTRY_HOST &&
  ENDPOINT_REGISTRY_PORT &&
  ENDPOINT_REGISTRY_URL_SUFFIX &&
  ENDPOINT_REGISTRY_ADMIN_USER &&
  ENDPOINT_REGISTRY_ADMIN_PASSWORD &&
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
  var messageDispatcher = new RegistryConnector(
    ENDPOINT_REGISTRY_PROTOCOL,
    ENDPOINT_REGISTRY_HOST,
    ENDPOINT_REGISTRY_PORT,
    ENDPOINT_REGISTRY_URL_SUFFIX,
    ENDPOINT_REGISTRY_ADMIN_USER as string,
    ENDPOINT_REGISTRY_ADMIN_PASSWORD as string
  );

  logger.info("HTTP Endpoint - Egress Service Started");

  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    messageDispatcher,
    brokerClient
  );

  //start listening for messages at the broker
  messageInterpreter.start([RABBITMQ_BROKER_TOPIC_EGRESS as string]);
} else {
  logger.error("One or more env variable not set, service not started");
}
