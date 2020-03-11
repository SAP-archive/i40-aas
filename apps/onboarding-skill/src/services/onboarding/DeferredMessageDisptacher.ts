import { Submodel, InteractionMessage } from 'i40-aas-objects';

import { CommandCollector } from '../../base/messaging/CommandCollector';
import { IMessageDispatcher } from './IMessageDispatcher';

import { ICommand } from '../../base/messaginginterface/ICommand';
import { AxiosResponse } from 'axios';
import { logger } from '../../log';

class DeferredMessageDispatcher implements IMessageDispatcher {
  private commandCollector: CommandCollector = new CommandCollector();

  constructor(private messageDispatcher: IMessageDispatcher) {}

  //no need to defer this, as no database commit involved
  createInstanceOnCAR(submodels: Submodel[]): Promise<AxiosResponse> {
    return this.messageDispatcher.createInstanceOnCAR(submodels);
  }

  sendErrorToOperator(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.sendErrorToOperator(message)
    });
  }
  sendRequestRefusedToOperator(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.sendRequestRefusedToOperator(message)
    });
  }
  sendNotUnderstoodToOperator(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.sendNotUnderstoodToOperator(message)
    });
  }
  requestApprovalFromApprover(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.requestApprovalFromApprover(message)
    });
  }

  replyRequestRefused(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.replyRequestRefused(message)
    });
  }
  replyError(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.replyError(message)
    });
  }
  sendResponseInstanceToOperator(
    message: InteractionMessage,
    submodel: Submodel
  ): void {
    var that = this;
    this.commandCollector.add({
      fn: () =>
        that.messageDispatcher.sendResponseInstanceToOperator(message, submodel)
    });
  }
  sendResponseTypeToOperator(message: InteractionMessage, type: any): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.sendResponseTypeToOperator(message, type)
    });
  }
  requestTypeFromManufacturer(receiverId: string, typeDescription: any): void {
    var that = this;
    this.commandCollector.add({
      fn: () =>
        that.messageDispatcher.requestTypeFromManufacturer(
          receiverId,
          typeDescription
        )
    });
  }
  replyNotUnderstood(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.replyNotUnderstood(message)
    });
  }

  public interpret(command: ICommand) {
    command.fn();
  }

  commit() {
    let c: ICommand | undefined;
    while ((c = this.commandCollector.pop()) !== undefined) {
      this.interpret(c);
    }
  }
}

export { DeferredMessageDispatcher };
