import { AmqpClient } from './base/messaging/AmqpClient';
import { MessageInterpreter } from './base/messaging/MessageInterpreter';
import { Skill } from './base/Skill';
import { MyAasMessageDispatcher } from './services/onboarding/MyAasMessageDispatcher';
import { MessageSender } from './base/messaging/MessageSender';
import { WebClient } from './web/WebClient';
import { SimpleMongoDbClient } from './base/persistence/SimpleMongoDbClient';
import { IDatabaseClient } from './base/persistenceinterface/IDatabaseClient';
import { logger } from './log';
import { TIdType, IdTypeEnum } from 'i40-aas-objects/dist/src/types/IdTypeEnum';
import { MyExternalRestServiceCaller } from './services/onboarding/MyExternalRestServiceCaller';
import { MyInitializer } from './services/onboarding/MyInitializer';

function checkEnvVar(variableName: string): string {
  let retVal: string | undefined = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      'A variable that is required by the skill has not been defined in the environment:' +
        variableName
    );
  }
}

let DATA_MANAGER_USER = checkEnvVar('CORE_DATA_MANAGER_USER');
let DATA_MANAGER_PASSWORD = checkEnvVar('CORE_DATA_MANAGER_PASSWORD');
let DATA_MANAGER_URL_SUFFIX = checkEnvVar('CORE_DATA_MANAGER_SUBMODELS_ROUTE');
let DATA_MANAGER_BASE_URL =
  checkEnvVar('CORE_DATA_MANAGER_PROTOCOL') +
  '://' +
  checkEnvVar('CORE_DATA_MANAGER_HOST') +
  ':' +
  checkEnvVar('CORE_DATA_MANAGER_PORT');

let ROOT_TOPIC = checkEnvVar('SKILLS_ONBOARDING_APPROVAL_ROOT_TOPIC');
let TOPIC = ROOT_TOPIC + '.*';
let MY_URI = checkEnvVar('SKILLS_ONBOARDING_APPROVAL_URI');
let MY_ROLE = checkEnvVar('SKILLS_ONBOARDING_APPROVAL_ROLE');
let COLLECTION_IN_DATABASE = checkEnvVar(
  'SKILLS_ONBOARDING_APPROVAL_STATES_COLLECTION'
);
let MONGO_INITDB_DATABASE = checkEnvVar('SKILLS_ONBOARDING_DATABASE_NAME');
let MONGO_INITDB_ROOT_USERNAME = checkEnvVar('SKILLS_ONBOARDING_DATABASE_USER');
let MONGO_INITDB_ROOT_PASSWORD = checkEnvVar(
  'SKILLS_ONBOARDING_DATABASE_PASSWORD'
);

let BROKER_URL = checkEnvVar('CORE_BROKER_HOST');
let BROKER_EXCHANGE = checkEnvVar('CORE_EGRESS_EXCHANGE');
let BROKER_USER = checkEnvVar('CORE_EGRESS_USER');
let BROKER_PASSWORD = checkEnvVar('CORE_EGRESS_PASSWORD');
let HTTPS_ENDPOINT_ROUTING_KEY = checkEnvVar('CORE_ENDPOINT_RESOLVER_QUEUE');

let MONGODB_HOST = checkEnvVar('SKILLS_ONBOARDING_DATABASE_HOST');
let MONGODB_PORT = checkEnvVar('SKILLS_ONBOARDING_DATABASE_PORT');

//Do not remove the next line as it initializes the logger
const initializeLogger = require('./log');

let amqpClient = new AmqpClient(
  BROKER_URL,
  BROKER_EXCHANGE,
  BROKER_USER,
  BROKER_PASSWORD,
  ROOT_TOPIC
);

let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
  new MessageSender(
    amqpClient,
    {
      identification: {
        id: MY_URI,
        idType: IdTypeEnum.IRI
      },
      role: {
        name: MY_ROLE
      }
    },
    HTTPS_ENDPOINT_ROUTING_KEY
  )
);

let dbClient: IDatabaseClient = new SimpleMongoDbClient(
  COLLECTION_IN_DATABASE,
  MONGO_INITDB_DATABASE,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGO_INITDB_ROOT_USERNAME,
  MONGO_INITDB_ROOT_PASSWORD
);

let skill = new Skill(
  new MyInitializer(
    messageDispatcher,
    new MyExternalRestServiceCaller(
      new WebClient(
        DATA_MANAGER_BASE_URL,
        DATA_MANAGER_USER,
        DATA_MANAGER_PASSWORD
      ),
      DATA_MANAGER_URL_SUFFIX
    ),
    {
      askForApproval: process.env.ONBOARDING_SKILL_REQUEST_APPROVAL
        ? eval(process.env.ONBOARDING_SKILL_REQUEST_APPROVAL)
        : false,
      askForType: process.env.ONBOARDING_SKILL_REQUEST_TYPE
        ? eval(process.env.ONBOARDING_SKILL_REQUEST_TYPE)
        : false
    }
  ),
  dbClient
);

//TODO: no need to share amqpClient amongst sender and receiver
let messageInterpreter: MessageInterpreter = new MessageInterpreter(
  skill,
  amqpClient
);

logger.info('***Central asset repository onboarding skill ready***');

messageDispatcher.start(() => {
  messageInterpreter.start(TOPIC);
});
