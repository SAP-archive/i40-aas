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

      //the receiver role field of the frame should not be empty
      let receiverURL = resolverMessage.ReceiverURL;
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


  private async handleResolverMessage(
    resolverMessage: IResolverMessage
  ) {
    let receiverURL: string = resolverMessage.ReceiverURL;

    if (receiverURL) {
      logger.debug(
        "[HTTP-Egress]: ReceiverURL is " + receiverURL
      );

      let interactionMessageBase64 = resolverMessage.EgressPayload
      let buff = Buffer.from(interactionMessageBase64, 'base64');
      let interactionMessageString = buff.toString('ascii');
      //the interaction message should not be empty

      if (!interactionMessageString) {
        this.handleUnactionableMessage(interactionMessageString, ["message.EgressPayload"]);
        return undefined;
      }

      //POST the Interaction message to the Receiver AAS
      var AASResponse = await sendInteractionReplyToAAS(receiverURL, interactionMessageString);

      logger.info("[AAS Client]: Successfully posted message. AAS Response was:" + AASResponse);
      //if ReceiverURL is missing
    } else {
      logger.error("[HTTP-Egress]: Error trying to read the ReceiverURL");
      this.handleUnactionableMessage("[HTTP-Egress]: Error trying to read the ReceiverURL");
      return undefined;
    }

  }

  async receive(msg: string) {
    //check if the message is valid for use
    let message = this.validateEssentialResolverElements(msg);

    if (message) {
      //if validation successful, get the AAS receiver endpoint from AAS-registry service
      logger.debug("HTTP-EGRESS: Received Msg " + JSON.stringify(message));
      //logger.info("Received Msg params [" + message.EgressPayload.frame.sender.role.name + " , " + message.EgressPayload.frame.receiver.role.name + " , " + message.EgressPayload.frame.type + " , " + message.EgressPayload.frame.conversationId + "]");
      await this.handleResolverMessage(message).catch(err => {logger.error("[AAS Client] Error posting to AAS Client : "+err)});

    }
  }
}

export { BrokerMessageInterpreter };
