import { AmqpClient } from "./messaging/AmqpClient";
import { ConsumeMessage } from "amqplib/callback_api";
import { MessageInterpreter } from "./messaging/MessageInterpreter";
import { AssetRepositoryOnboardingSkill } from "./services/onboarding/AssetRepositoryOnboardingSkill";
import { MessageDispatcher } from "./messaging/MessageDispatcher";
import { MessageSender } from "./messaging/MessageSender";
import { WebClient } from "./web/WebClient";
import { SimpleMongoDbClient } from "./persistence/SimpleMongoDbClient";
import { IDatabaseClient } from "./services/onboarding/persistenceinterface/IDatabaseClient";
import { logger } from "./log";

//the last entry or the topic acts as wildcard to see for the type=approved and requestRejected cases
let TOPIC = "i40:registry-semanticProtocol/onboarding.CentralAssetRepository.*";
let MY_URI = "sap.com/aas/skills/onboarding/CentralAssetRepository";
let MY_ROLE = "CentralAssetRepository";
let DATA_MANAGER_USER: string | undefined = process.env.DATA_MANAGER_USER;
let DATA_MANAGER_PASSWORD: string | undefined =
  process.env.DATA_MANAGER_PASSWORD;
let DATA_MANAGER_URL_SUFFIX = "/submodels";
let COLLECTION_IN_DATABASE = "car-onboarding-states";

let BROKER_URL: string | undefined = process.env.AMQP_URL;
let BROKER_EXCHANGE: string | undefined = process.env.BROKER_EXCHANGE;
let BROKER_USER: string | undefined = process.env.BROKER_USER;
let BROKER_PASSWORD: string | undefined = process.env.BROKER_PASSWORD;
let DATA_MANAGER_BASE_URL: string | undefined = process.env.DATA_MANAGER_URL;

if (BROKER_URL === undefined) {
  throw new Error("[AMQP] No AMQP_URL found in environment");
}
if (BROKER_EXCHANGE === undefined) {
  BROKER_EXCHANGE = "amq.topic";
  logger.warn("[AMQP] No broker exchange type was found in environment");
}
if (BROKER_USER === undefined) {
  throw new Error(" [AMQP] No Broker user was found in environment");
}
if (BROKER_PASSWORD === undefined) {
  throw new Error(" [AMQP] No Broker password was found in environment");
}
if (DATA_MANAGER_BASE_URL === undefined) {
  throw new Error(" [AMQP] No data manager url was found in environment");
}
if (DATA_MANAGER_USER === undefined) {
  throw new Error(" [AMQP] No data manager user was found in environment");
}
if (DATA_MANAGER_PASSWORD === undefined) {
  throw new Error(" [AMQP] No data manager password was found in environment");
}

//Do not remove the next line as it initializes the logger
const initializeLogger = require("./log");
let HTTP_ENDPOINT_ROUTING_KEY = "http.client";
if (BROKER_URL === undefined) {
  throw new Error("No AMQP_URL found in environment");
}
let amqpClient = new AmqpClient(
  BROKER_URL,
  BROKER_EXCHANGE,
  BROKER_USER,
  BROKER_PASSWORD,
  "i40:registry-semanticProtocol-onboarding.SAP_CentralAssetRepository"
);

let messageDispatcher: MessageDispatcher = new MessageDispatcher(
  new MessageSender(
    amqpClient,
    {
      identification: {
        id: MY_URI,
        idType: "URI"
      },
      role: {
        name: MY_ROLE
      }
    },
    HTTP_ENDPOINT_ROUTING_KEY
  ),
  new WebClient(
    DATA_MANAGER_BASE_URL,
    DATA_MANAGER_USER,
    DATA_MANAGER_PASSWORD
  ),
  DATA_MANAGER_URL_SUFFIX
);

if (
  !process.env.MONGODB_HOST ||
  !process.env.MONGODB_PORT ||
  !process.env.MONGO_INITDB_DATABASE
) {
  throw new Error(
    "These environment variables need to be set: MONGODB_HOST, MONGODB_PORT, MONGO_INITDB_DATABASE"
  );
}
let dbClient: IDatabaseClient = new SimpleMongoDbClient(
  COLLECTION_IN_DATABASE,
  process.env.MONGO_INITDB_DATABASE,
  process.env.MONGODB_HOST,
  process.env.MONGODB_PORT,
  process.env.MONGO_INITDB_ROOT_USERNAME,
  process.env.MONGO_INITDB_ROOT_PASSWORD
);

let skill = new AssetRepositoryOnboardingSkill(messageDispatcher, dbClient);

//TODO: no need to share amqpClient amongst sender and receiver
let messageInterpreter: MessageInterpreter = new MessageInterpreter(
  skill,
  amqpClient
);

logger.info("***Central asset repository onboarding (A0002) skill ready***");

messageDispatcher.start(() => {
  messageInterpreter.start(TOPIC);
});
