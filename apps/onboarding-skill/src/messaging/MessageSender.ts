import { AmqpClient } from "./AmqpClient";
import { Submodel, IFrame } from "i40-aas-objects";

import { IMessageSender } from "../services/onboarding/messaginginterface/IMessageSender";
import { IConversationMember } from "i40-aas-objects/dist/src/interaction/ConversationMember";

const uuidv4 = require("uuid/v4");

class MessageSender implements IMessageSender {
  sendTo(frame: IFrame, interactionElements?: Submodel[]) {
    let message: any = {
      frame: frame,
      interactionElements: interactionElements ? interactionElements : []
    };
    this.amqpClient.publish(
      this.httpEgressEndpointRoutingKey,
      JSON.stringify(message)
    );
  }

  replyTo(sourceFrame: IFrame, type: string, interactionElements?: Submodel[]) {
    let message: any = {
      frame: this.getReplyFrame(sourceFrame, type),
      interactionElements: interactionElements ? interactionElements : []
    };
    this.amqpClient.publish(
      this.httpEgressEndpointRoutingKey,
      JSON.stringify(message)
    );
  }

  constructor(
    private amqpClient: AmqpClient,
    private skillIdentification: IConversationMember,
    private httpEgressEndpointRoutingKey: string
  ) {}

  start(notifyReady?: () => void) {
    this.amqpClient.setupPublishing(notifyReady);
  }

  private getReplyFrame(frameOfSource: IFrame, type: string) {
    let frame: any = JSON.parse(JSON.stringify(frameOfSource));
    frame.receiver = frame.sender;
    frame.sender = this.skillIdentification;
    frame.type = type;
    frame.messageId = uuidv4();
    return frame;
  }
}

export { MessageSender };
