import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';
import { BrokerMessageInterpreter } from "./messaging/BrokerMessageInterpreter";
import { logger } from "./utils/log";


// Message broker Config
let CORE_BROKER_HOST= checkEnvVar('CORE_BROKER_HOST');
let CORE_BROKER_PORT= checkEnvVar('CORE_BROKER_PORT');
let CORE_EGRESS_EXCHANGE = checkEnvVar('CORE_EGRESS_EXCHANGE');
let CORE_EGRESS_USER = checkEnvVar('CORE_EGRESS_USER');
let CORE_EGRESS_PASSWORD = checkEnvVar('CORE_EGRESS_PASSWORD');
let CORE_EGRESS_HTTP_QUEUE= checkEnvVar('CORE_EGRESS_HTTP_QUEUE');
let CORE_EGRESS_HTTP_BROKER_BINDINGKEY = CORE_EGRESS_EXCHANGE + "." + CORE_EGRESS_HTTP_QUEUE

  var brokerClient = new AmqpClient(
    CORE_BROKER_HOST,
    CORE_BROKER_PORT,
    CORE_EGRESS_EXCHANGE,
    CORE_EGRESS_USER,
    CORE_EGRESS_PASSWORD,
    CORE_EGRESS_HTTP_QUEUE
  );

  logger.info("HTTP Endpoint - Egress Service Started");

  let messageInterpreter: BrokerMessageInterpreter = new BrokerMessageInterpreter(
    brokerClient
  );

  //start listening for messages at the broker
  messageInterpreter.start(CORE_EGRESS_HTTP_BROKER_BINDINGKEY as string);




function checkEnvVar(variableName: string): string {
  let retVal: string | undefined = process.env[variableName];
  if (retVal) {
    return retVal;
  } else {
    throw new Error(
      'A variable that is required by the service has not been defined in the environment:' +
        variableName
    );
  }
}
