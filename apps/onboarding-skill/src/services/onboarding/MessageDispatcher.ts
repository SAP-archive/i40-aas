import { IMessageSender } from '../../base/messaginginterface/IMessageSender';

import { WebClient } from '../../web/WebClient';
import { Submodel, InteractionMessage, IFrame } from 'i40-aas-objects';
import { IMessageDispatcher } from './IMessageDispatcher';
import { Roles } from '../../base/messaginginterface/Roles';
import { MessageTypes } from '../../base/messaginginterface/MessageTypes';

class MessageDispatcher implements IMessageDispatcher {
  sendNextMessageInConversationTo(
    receiverRoleName: string,
    messageType: string,
    lastReceivedFrameInConversation: IFrame,
    interactionElements?: object[]
  ) {
    const uuidv1 = require('uuid/v1');
    var _ = require('lodash');
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

  constructor(private messageSender: IMessageSender) {}

  replyRequestRefused(message: InteractionMessage) {
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
    this.sendNextMessageInConversationTo(
      Roles.OPERATOR,
      MessageTypes.RESPONSE_INSTANCE,
      message.frame,
      [submodel]
    );
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
      Roles.OPERATOR,
      MessageTypes.RESPONSE_TYPE,
      message.frame
    );
  }

  requestTypeFromManufacturer(receiverId: string, typeDescription: any) {
    throw new Error('Method not implemented');
  }

  replyNotUnderstood(message: InteractionMessage): void {
    this.messageSender.replyTo(message.frame, MessageTypes.NOT_UNDERSTOOD, []);
  }
  start(notifyReady?: () => void) {
    this.messageSender.start(notifyReady);
  }
}

export { MessageDispatcher };
