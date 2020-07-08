import { MessageInterpreter } from './base/messaging/MessageInterpreter';
import { Skill } from './base/Skill';
import { MyAasMessageDispatcher } from './services/onboarding/MyAasMessageDispatcher';
import { MessageSender } from './base/messaging/MessageSender';
import { WebClient } from './web/WebClient';
import { SimpleMongoDbClient } from './base/persistence/SimpleMongoDbClient';
import { IDatabaseClient } from './base/persistenceinterface/IDatabaseClient';
import { TIdType, IdTypeEnum } from 'i40-aas-objects/dist/src/types/IdTypeEnum';
import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';
import { MyExternalRestServiceCaller } from './services/onboarding/MyExternalRestServiceCaller';
import { MyInitializer } from './services/onboarding/MyInitializer';
import { uuid } from 'uuidv4';
import fs from 'fs';

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

let TLS_CERTFILE = checkEnvVar('TLS_CERTFILE');
let TLS_ENABLED = checkEnvVar('TLS_ENABLED');

let DATA_MANAGER_USER = checkEnvVar('CORE_DATA_MANAGER_USER');
let DATA_MANAGER_PASSWORD = checkEnvVar('CORE_DATA_MANAGER_PASSWORD');
let DATA_MANAGER_URL_SUFFIX = checkEnvVar('CORE_DATA_MANAGER_SUBMODELS_ROUTE');

let DATA_MANAGER_BASE_URL = checkEnvVar('TLS_ENABLED');
if (DATA_MANAGER_BASE_URL == 'true') {
  DATA_MANAGER_BASE_URL = 'https'+
  '://' +
  checkEnvVar('CORE_DATA_MANAGER_HOST') +
  ':' +
  checkEnvVar('CORE_DATA_MANAGER_PORT');
} else {
  DATA_MANAGER_BASE_URL = 'http'+
  '://' +
  checkEnvVar('CORE_DATA_MANAGER_HOST') +
  ':' +
  checkEnvVar('CORE_DATA_MANAGER_PORT');
}

let ROOT_TOPIC = checkEnvVar('SKILLS_ONBOARDING_ROOT_TOPIC');
let TOPIC = ROOT_TOPIC + '.*';
let MY_URI = checkEnvVar('SKILLS_ONBOARDING_URI');
let MY_ROLE = checkEnvVar('SKILLS_ONBOARDING_ROLE');

// The queue is generated based on the binding key and is unique for the client
// GUID + CORE_EGRESS_HTTP_BROKER_BINDINGKEY; //TODO: here also from env variable??

let BROKER_QUEUE = ROOT_TOPIC + '/' + uuid(); //TODO: here also from env variable??

let COLLECTION_IN_DATABASE = checkEnvVar('SKILLS_ONBOARDING_STATES_COLLECTION');
let MONGO_INITDB_DATABASE = checkEnvVar('SKILLS_ONBOARDING_DATABASE_NAME');
let MONGO_INITDB_ROOT_USERNAME = checkEnvVar('SKILLS_ONBOARDING_DATABASE_USER');
let MONGO_INITDB_ROOT_PASSWORD = checkEnvVar(
  'SKILLS_ONBOARDING_DATABASE_PASSWORD'
);
let SKILLS_ONBOARDING_DATABASE_AUTHENTICATION_DB =
  process.env['SKILLS_ONBOARDING_DATABASE_AUTHENTICATION_DB'];

let BROKER_HOST = checkEnvVar('CORE_BROKER_HOST');
let BROKER_PORT = checkEnvVar('CORE_BROKER_PORT');
let BROKER_EXCHANGE = checkEnvVar('CORE_EGRESS_EXCHANGE');
let BROKER_USER = checkEnvVar('CORE_EGRESS_USER');
let BROKER_PASSWORD = checkEnvVar('CORE_EGRESS_PASSWORD');
let CORE_EGRESS_ROUTINGKEY = checkEnvVar('CORE_EGRESS_ROUTINGKEY');

let MONGODB_HOST = checkEnvVar('SKILLS_ONBOARDING_DATABASE_HOST');
let MONGODB_PORT = checkEnvVar('SKILLS_ONBOARDING_DATABASE_PORT');

//Do not remove the next line as it initializes the logger
const logger = require('aas-logger/lib/log');

let amqpClient = new AmqpClient(
  BROKER_HOST,
  BROKER_PORT,
  BROKER_EXCHANGE,
  BROKER_USER,
  BROKER_PASSWORD,
  BROKER_QUEUE
);

let messageDispatcher: MyAasMessageDispatcher = new MyAasMessageDispatcher(
  new MessageSender(
    amqpClient,
    {
      identification: {
        id: MY_URI,
        idType: IdTypeEnum.IRI,
      },
      role: {
        name: MY_ROLE,
      },
    },
    CORE_EGRESS_ROUTINGKEY
  )
);

let dbClient: IDatabaseClient = new SimpleMongoDbClient(
  COLLECTION_IN_DATABASE,
  MONGO_INITDB_DATABASE,
  MONGODB_HOST,
  MONGODB_PORT,
  MONGO_INITDB_ROOT_USERNAME,
  MONGO_INITDB_ROOT_PASSWORD,
  SKILLS_ONBOARDING_DATABASE_AUTHENTICATION_DB
);

let skill = new Skill(
  new MyInitializer(
    messageDispatcher,
    new MyExternalRestServiceCaller(
      new WebClient(
        DATA_MANAGER_BASE_URL,
        DATA_MANAGER_USER,
        DATA_MANAGER_PASSWORD,
        TLS_ENABLED == 'true' ? fs.readFileSync(TLS_CERTFILE, "utf8") : undefined
      ),
      DATA_MANAGER_URL_SUFFIX
    ),
    {
      askForApproval: process.env.ONBOARDING_SKILL_REQUEST_APPROVAL
        ? eval(process.env.ONBOARDING_SKILL_REQUEST_APPROVAL)
        : false,
      askForType: process.env.ONBOARDING_SKILL_REQUEST_TYPE
        ? eval(process.env.ONBOARDING_SKILL_REQUEST_TYPE)
        : false,
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
