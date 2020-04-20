import {  publishMessageToBrokerTopic } from "./InteractionHandler";
import { AmqpClient } from 'AMQP-Client/lib/AmqpClient';
import * as logger from "winston";

let brokerClient: AmqpClient;

export function initiateBroker(broker: AmqpClient) {
  brokerClient = broker;
  brokerClient.setupPublishing();
}

export const publishInteractionToBroker = async (
  topic: string,
  req: string
) => {
  //if the client is not connected to broker return a 500 Error
  if (!brokerClient.isConnected()) {
    logger.error(
      'Broker client was not initiated or connected, check connection'
    );
    return new Error('Broker connection error. Message was not published');
  } else {
    logger.info('publishing a message to topic ' + topic);
    return await publishMessageToBrokerTopic(brokerClient, req, topic);
  }
};
