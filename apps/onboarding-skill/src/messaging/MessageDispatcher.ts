import { IMessageSender } from "../services/onboarding/messaginginterface/IMessageSender";
import * as logger from "winston";

import { WebClient } from "../web/WebClient";
import { AxiosResponse } from "axios";
import {
  Submodel,
  InteractionMessage,
  IFrame,
  SubmodelInterface
} from "i40-aas-objects";
import { IMessageDispatcher } from "../services/onboarding/messaginginterface/IMessageDispatcher";
import { Roles } from "../services/onboarding/messaginginterface/Roles";
import { MessageTypes } from "../services/onboarding/messaginginterface/MessageTypes";

class MessageDispatcher implements IMessageDispatcher {
  sendNextMessageInConversationTo(
    receiverRoleName: string,
    messageType: string,
    lastReceivedFrameInConversation: IFrame,
    interactionElements?: SubmodelInterface[]
  ) {
    const uuidv1 = require("uuid/v1");
    var _ = require("lodash");
    let frame: IFrame = {
      semanticProtocol: lastReceivedFrameInConversation.semanticProtocol,
      type: messageType,
      messageId: uuidv1(),
      receiver: { role: { name: receiverRoleName } },
      sender: _.cloneDeep(lastReceivedFrameInConversation.receiver),
      conversationId: lastReceivedFrameInConversation.conversationId
    };
    this.messageSender.sendTo(frame, interactionElements);
  }

  requestApprovalFromApprover(message: InteractionMessage): void {
    this.sendNextMessageInConversationTo(
      Roles.APPROVER,
      MessageTypes.REQUEST_APPROVAL,
      message.frame,
      message.interactionElements
    );
  }

  constructor(
    private messageSender: IMessageSender,
    private webClient: WebClient,
    private dataManagerUrlSuffix: string
  ) {}

  async createInstanceOnCAR(submodels: Submodel[]): Promise<AxiosResponse> {
    logger.debug("MessageDispatcher:createInstanceOnCAR called");
    return await this.webClient.postRequest(
      this.dataManagerUrlSuffix,
      submodels
    );
  }

  replyRequestRefused(message: InteractionMessage) {
    //TODO: use constants for strings
    this.messageSender.replyTo(message.frame, MessageTypes.REQUEST_REFUSED);
  }

  replyError(message: InteractionMessage) {
    this.messageSender.replyTo(message.frame, MessageTypes.ERROR);
  }

  sendResponseInstanceToOperator(
    message: InteractionMessage,
    submodel: Submodel
  ) {
    //TODO: an error here leads to unhandled rejection
    this.messageSender.replyTo(message.frame, MessageTypes.RESPONSE_INSTANCE, [
      submodel
    ]);
  }

  sendErrorToOperator(message: InteractionMessage) {
    this.sendNextMessageInConversationTo(
      Roles.OPERATOR,
      MessageTypes.ERROR,
      message.frame
    );
  }

  sendRequestRefusedToOperator(message: InteractionMessage) {
    this.sendNextMessageInConversationTo(
      Roles.OPERATOR,
      MessageTypes.REQUEST_REFUSED,
      message.frame
    );
  }

  sendNotUnderstoodToOperator(message: InteractionMessage) {
    this.sendNextMessageInConversationTo(
      Roles.OPERATOR,
      MessageTypes.NOT_UNDERSTOOD,
      message.frame
    );
  }

  //TODO: do this properly, not just mock
  sendResponseTypeToOperator(message: InteractionMessage, type: any) {
    this.sendNextMessageInConversationTo(
      "Operator",
      "responseType",
      message.frame
    );
  }

  requestTypeFromManufacturer(receiverId: string, typeDescription: any) {
    throw new Error("Method not implemented");
  }

  replyNotUnderstood(message: InteractionMessage): void {
    this.messageSender.replyTo(message.frame, "notUnderstood", []);
  }
  start(notifyReady?: () => void) {
    this.messageSender.start(notifyReady);
  }
}

export { MessageDispatcher };
