import * as logger from "winston";
import { Subscription } from "./interfaces/Subscription";
import { IMessageReceiver } from "./interfaces/IMessageReceiver";
import { IInteractionMessage } from "i40-aas-objects";
import { AmqpClient } from "./AMQPClient";
import { IResolverMessage } from "./interfaces/IResolverMessage";
import { AxiosResponse } from "axios";
import { IRegistryEntry, IEndpoint } from "../WebClient/model/RegistryEntryDAO";
import { sendInteractionReplyToAAS } from "./AASConnector";

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

  //Here handle the case of no valid fields like ReceiverURL
  private handleUnintelligibleMessage(
    message: IResolverMessage,
    missingData: string[]
  ) {
    logger.error(
      "Missing necessary data, " +
      missingData.toString() +
      ", in incoming message:" +
      message
    );
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

  /*
  Check that the message received from the resolver is valid.
  With regards to
  */
  private validateEssentialResolverElements(
    msg: string
  ): IResolverMessage | undefined {
    //variable to hold the message
    let resolverMessage: IResolverMessage | undefined = undefined;
    try {
      //assign the parsed message to the data variable
      resolverMessage = JSON.parse(msg);
      if (!resolverMessage) {
        this.handleUnactionableMessage(msg);
        return undefined;
      }
      //the interaction message should not be empty
      let interactionMessage = resolverMessage.interactionMessage;
      if (!interactionMessage) {
        this.handleUnactionableMessage(msg, ["message.receiverURL"]);
        return undefined;
      }

      //the receiver role field of the frame should not be empty
      let receiverURL = resolverMessage.receiverURL;
      if (!receiverURL) {
        this.handleUnactionableMessage(msg, ["message.receiverURL"]);
        return undefined;
      }
      return resolverMessage;
    } catch (error) {
      logger.error(
        "Generic error received during validation of essential fields: " + error
      );
      this.handleUnactionableMessage(msg);
      return undefined;
    }
  }


  private handleResolverMessage(
    resolverMessage: IResolverMessage
  ) {
    let receiverURL: string = resolverMessage.receiverURL;

    if (receiverURL) {
      logger.info(
        "[HTTP-Egress]: ReceiverURL is " + receiverURL
      );
      try {
        //POST the Interaction message to the Receiver AAS
        sendInteractionReplyToAAS(receiverURL, resolverMessage.interactionMessage);
      } catch (error) {
        logger.error(
          "Error when posting to AAS " +
          error
        );
        throw Error(error);
      }

      //if ReceiverURL is missing
    } else {
      logger.error("[HTTP-Egress]: Error trying to read the ReceiverURL");
      this.handleUnactionableMessage("[HTTP-Egress]: Error trying to read the ReceiverURL");
      return undefined;
    }

  }

  receive(msg: string) {
    //check if the message is valid for use
    let message = this.validateEssentialResolverElements(msg);

    if (message) {
      //if validation successful, get the AAS receiver endpoint from AAS-registry service
      logger.debug("Received Msg params [" + message.interactionMessage.frame.sender.role.name + " , " + message.interactionMessage.frame.receiver.role.name + " , " + message.interactionMessage.frame.type + " , " + message.interactionMessage.frame.conversationId + "]");
      this.handleResolverMessage(message);

    }
  }
}

export { BrokerMessageInterpreter };
