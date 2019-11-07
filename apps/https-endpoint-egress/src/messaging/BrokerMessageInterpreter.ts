import * as logger from "winston";
import { Subscription } from "./interfaces/Subscription";
import { IMessageReceiver } from "./interfaces/IMessageReceiver";
import { IInteractionMessage } from "i40-aas-objects";
import { AmqpClient } from "./AMQPClient";
import { RegistryConnector } from "./RegistryConnector";

/*
Class that receives the the Interaction Messages received from the broker.
The messages after validation are sent to the RegistryConnector that makes a request to the client
*/

class BrokerMessageInterpreter implements IMessageReceiver {
  
// Import events module
events = require('events');
eventEmitter: any;
// Create an eventEmitter object
 

  
  constructor(
    private registryConnector: RegistryConnector,
    private brokerClient: AmqpClient
  ) {
    this.eventEmitter = new this.events.EventEmitter();
  }

  /**
   * Initiate listening to the broker topic, designated for forwarding responses from skills to clients
   * @param routingKeys
   */
  start(routingKeys: string[]) {
    this.brokerClient.addSubscriptionData(new Subscription(routingKeys, this));
    this.brokerClient.startListening();
  }

  private handleUnintelligibleMessage(
    message: IInteractionMessage,
    missingData: string[]
  ) {
    logger.error(
      "Missing necessary data, " +
        missingData.toString() +
        ", in incoming message:" +
        message
    );
    this.registryConnector.receivedUnintelligibleMessage(message);
  }
  /*
Decide what to do if the message can not be handled (eg. because receiver role is missing)
*/
  private handleUnactionableMessage(message: string, missingData?: string[]) {
    if (missingData) {
      logger.error(
        "Cannot react to this message as the following data, " +
          missingData.toString() +
          ", is missing: " +
          message
      );
    } else {
      logger.error("Cannot react to this unparsable message:" + message);
    }
  }

  private validateRequired(data: IInteractionMessage): boolean {
    //essential validation passed: receiverRole exists
    let reiverRole: string | undefined;
    let conversationId: string | undefined;
    try {
      reiverRole = data.frame.receiver.role.name;
      conversationId = data.frame.conversationId;

      //check if any of them is empty
      let requiredAndMissingData: string[] = [
        reiverRole,
        conversationId
      ].filter(e => e.length === 0);

      if (requiredAndMissingData.length > 0) {
        this.handleUnintelligibleMessage(data, requiredAndMissingData);
        return false;
      }
    } catch (error) {
      logger.error(
        "Generic error received during validation of required fields:" + error
      );
      return false;
    }
    return true;
  }

  /*
  Check that the message received from the broker are valid. 
  With regards to the Frame schema
  */
  private validateEssentialInteractionElements(
    msg: string
  ): IInteractionMessage | undefined {
    //variable to hold the message
    let data: IInteractionMessage | undefined = undefined;
    try {
      //assign the parsed message to the data variable
      data = JSON.parse(msg);
      if (!data) {
        this.handleUnactionableMessage(msg);
        return undefined;
      }
      //the receiver role field of the frame should not be empty
      let essentialData = data.frame.receiver.role.name;
      if (!essentialData) {
        this.handleUnactionableMessage(msg, ["frame.receiver.role.name"]);
        return undefined;
      }
      return data;
    } catch (error) {
      logger.error(
        "Generic error received during validation of essential fields: " + error
      );
      this.handleUnactionableMessage(msg);
      return undefined;
    }
  }

  receive(msg: string) {
    //logger.info("Got msg: " + msg);
    let message = this.validateEssentialInteractionElements(msg);
    if (message && this.validateRequired(message)) {
      //if validation successful, get the AAS receiver endpoint from AAS-registry service
      this.registryConnector.getReceiverURLFromRegistry(message);
    }
  }
}

export { BrokerMessageInterpreter };
