import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';
import { BrokerMessageInterpreter } from './messaging/BrokerMessageInterpreter';
import { logger } from './utils/log';

// if (process.env.NODE_ENV !== 'production') {
const dotenv = require('dotenv');
dotenv.config();

// Message broker Config
let CORE_BROKER_HOST: string | undefined = process.env.CORE_BROKER_HOST;
let CORE_BROKER_PORT: string | undefined = process.env.CORE_BROKER_PORT;
let CORE_EGRESS_EXCHANGE: string | undefined = process.env.CORE_EGRESS_EXCHANGE;
let CORE_EGRESS_USER: string | undefined = process.env.CORE_EGRESS_USER;
let CORE_EGRESS_PASSWORD: string | undefined = process.env.CORE_EGRESS_PASSWORD;
let CORE_EGRESS_HTTP_QUEUE: string | undefined =
  process.env.CORE_EGRESS_HTTP_QUEUE;
let CORE_EGRESS_HTTP_BROKER_BINDINGKEY =
  CORE_EGRESS_EXCHANGE + '.' + CORE_EGRESS_HTTP_QUEUE;

logger.debug('Env Variable CORE_BROKER_HOST: ' + CORE_BROKER_HOST);
logger.debug('Env Variable CORE_EGRESS_EXCHANGE: ' + CORE_EGRESS_EXCHANGE);
logger.debug(
  'Env Variable CORE_EGRESS_HTTP_BROKER_BINDINGKEY: ' +
    CORE_EGRESS_HTTP_BROKER_BINDINGKEY
);

if (
  CORE_BROKER_HOST &&
  CORE_BROKER_PORT &&
  CORE_EGRESS_EXCHANGE &&
  CORE_EGRESS_HTTP_BROKER_BINDINGKEY &&
  CORE_EGRESS_HTTP_QUEUE &&
  CORE_EGRESS_USER &&
  CORE_EGRESS_PASSWORD
) {
  var brokerClient = new AmqpClient(
    CORE_BROKER_HOST,
    CORE_BROKER_PORT,
    CORE_EGRESS_EXCHANGE,
    CORE_EGRESS_USER,
    CORE_EGRESS_PASSWORD,
    CORE_EGRESS_HTTP_QUEUE
  );

  logger.info('HTTP Endpoint - Egress Service Started');

  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    brokerClient
  );

  //start listening for messages at the broker
  messageInterpreter.start(CORE_EGRESS_HTTP_BROKER_BINDINGKEY as string);
} else {
  logger.error('One or more env variable not set, service not started');
}
