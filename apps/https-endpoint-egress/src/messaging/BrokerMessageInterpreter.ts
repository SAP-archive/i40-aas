import { Subscription } from "./interfaces/Subscription";
import { IMessageReceiver } from "./interfaces/IMessageReceiver";
import { IInteractionMessage } from "i40-aas-objects";
import { AmqpClient } from "./AMQPClient";
import { IResolverMessage } from "./interfaces/IResolverMessage";
import { AASConnector } from "./AASConnector";
import { WebClient } from "../WebClient/WebClient";
import { logger } from "./../utils/log";

/*
Class that receives the the Interaction Messages received from the broker.
The messages after validation are sent to the RegistryConnector that makes a request to the client
*/

class BrokerMessageInterpreter implements IMessageReceiver {

  //dispatcher of messages to AAS Clients
  aasConn = new AASConnector(new WebClient());

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

      //the interaction message should not be empty
      //decode and parse the message received from the broker
      //TODO: check how we can improve the decoding. Or place the decoding in th receive()
      let interactionMessageString = JSON.parse(Buffer.from(resolverMessage.EgressPayload, 'base64').toString());

      if (!interactionMessageString) {
        this.handleUnactionableMessage(interactionMessageString, ["message.EgressPayload"]);
        return undefined;
      }
      //POST the Interaction message to the Receiver AAS
      var AASResponse = await this.aasConn.sendInteractionReplyToAAS(receiverURL, interactionMessageString);

      logger.info(`[AAS Client]: Successfully posted message. AAS Response was: ${AASResponse.status}: ${AASResponse.statusText}`);
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

      // logger.info("Received Msg [" + message.EgressPayload.frame.sender.role.name + " , " + message.EgressPayload.frame.receiver.role.name + " , " + message.EgressPayload.frame.type + " , " + message.EgressPayload.frame.conversationId + "]");
      await this.handleResolverMessage(message).catch(err => { logger.error("[AAS Client] Error posting to AAS Client : " + err) });

    }
  }
}

export { BrokerMessageInterpreter };
