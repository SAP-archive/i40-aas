import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';

const logger = require('aas-logger/lib/log');

export const publishMessageToBrokerTopic = async (
  brokerClient: AmqpClient,
  requestBody: string,
  topic: string
) => {
  brokerClient.publish(topic, JSON.stringify(requestBody));
  logger.info('message published to broker topic ' + topic);

  //TODO: check if we need to handle publisher confirms here

  return requestBody;
};
