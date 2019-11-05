import { IMessageSender } from "../services/onboarding/messaginginterface/IMessageSender";
import * as logger from "winston";

import { WebClient } from "../web/WebClient";
import { AxiosResponse } from "axios";
import { Submodel, InteractionMessage, IFrame } from "i40-aas-objects";
import { IMessageDispatcher } from "../services/onboarding/messaginginterface/IMessageDispatcher";

class MessageDispatcher implements IMessageDispatcher {
  requestApprovalFromApprover(message: InteractionMessage): void {
    const uuidv1 = require("uuid/v1");
    var _ = require("lodash");
    let frame: IFrame = {
      semanticProtocol: message.frame.semanticProtocol,
      type: "requestApproval",
      messageId: uuidv1(),
      receiver: { role: { name: "approver" } },
      sender: _.cloneDeep(message.frame.receiver),
      conversationId: message.frame.conversationId
    };
    this.messageSender.sendTo(frame, message.interactionElements);
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

  sendRequestRefusedToInitiator(message: InteractionMessage) {
    //TODO: use constants for strings
    this.messageSender.replyTo(message.frame, "requestRefused");
  }

  replyError(message: InteractionMessage) {
    this.messageSender.replyTo(message.frame, "error");
  }

  sendResponseInstanceToInitiator(
    message: InteractionMessage,
    submodel: Submodel
  ) {
    //TODO: an error here leads to unhandled rejection
    this.messageSender.replyTo(message.frame, "responseInstance", [submodel]);
  }

  //TODO: do this properly, not just mock
  sendResponseTypeToInitiator(message: InteractionMessage, type: any) {
    this.messageSender.replyTo(message.frame, "responseType", [type]);
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
