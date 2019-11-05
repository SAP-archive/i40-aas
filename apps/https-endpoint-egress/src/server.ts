import { AmqpClient } from "./messaging/AMQPClient";
import { BrokerMessageInterpreter } from "./messaging/BrokerMessageInterpreter";
import { logger } from "./utils/log";
import { MessageHandler } from "./messaging/RegistryConnector";

// if (process.env.NODE_ENV !== 'production') {
const dotenv = require("dotenv");
dotenv.config();

let BROKER_URL: string | undefined = process.env.AMQP_URL;
let BROKER_EXCHANGE: string | undefined = process.env.BROKER_EXCHANGE;
let BROKER_USER: string | undefined = process.env.BROKER_USER;
let BROKER_PASSWORD: string | undefined = process.env.BROKER_PASSWORD;
let BROCKER_QUEUE = "endpoint-egress"; //TODO: here also from env variable

let BROKER_TOPIC_EGRESS: string | undefined = process.env.BROKER_TOPIC_EGRESS;
let REGISTRY_URL: string | undefined = process.env.REGISTRY_URL;
let REGISTRY_URL_GET_SUFFIX: string | undefined = "/endpoints";
// process.env.REGISTRY_URL_GET_SUFFIX;
let REGISTRY_ADMIN_USER: string | undefined = process.env.REGISTRY_ADMIN_USER;
let REGISTRY_ADMIN_PASSWORD: string | undefined =
  process.env.REGISTRY_ADMIN_PASSWORD;

logger.debug("Env Variable BROKER_URL: " + BROKER_URL);
logger.debug("Env Variable BROKER_EXCHANGE: " + BROKER_EXCHANGE);
logger.debug("Env Variable BROKER_TOPIC_EGRESS: " + BROKER_TOPIC_EGRESS);
logger.debug("Env Variable REGISTRY_URL: " + REGISTRY_URL);
logger.debug(
  "Env Variable REGISTRY_URL_GET_SUFFIX: " + REGISTRY_URL_GET_SUFFIX
);

if (
  BROKER_URL &&
  BROKER_EXCHANGE &&
  BROKER_TOPIC_EGRESS &&
  REGISTRY_URL &&
  REGISTRY_URL_GET_SUFFIX &&
  REGISTRY_ADMIN_USER &&
  REGISTRY_ADMIN_PASSWORD &&
  BROKER_USER &&
  BROKER_PASSWORD
) {
  var brokerClient = new AmqpClient(
    BROKER_URL,
    BROKER_EXCHANGE,
    BROKER_USER,
    BROKER_PASSWORD,
    BROCKER_QUEUE
  );
  var msgHandler = new MessageHandler(
    REGISTRY_URL,
    REGISTRY_URL_GET_SUFFIX,
    REGISTRY_ADMIN_USER as string,
    REGISTRY_ADMIN_PASSWORD as string
  );

  logger.info("HTTP Endpoint - Egress Service Started");

  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    msgHandler,
    brokerClient
  );

  messageInterpreter.start([BROKER_TOPIC_EGRESS as string]);
} else {
  logger.info("One or more env variable not set, exiting service");
  //TODO: check why process does not exit on some occasions (npn run script?)
  process.exit(1);
}
