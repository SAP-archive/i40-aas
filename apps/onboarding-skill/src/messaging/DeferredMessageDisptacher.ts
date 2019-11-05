import { Submodel, InteractionMessage } from "i40-aas-objects";

import { CommandCollector } from "./CommandCollector";
import { IMessageDispatcher } from "../services/onboarding/messaginginterface/IMessageDispatcher";

import { ICommand } from "../services/onboarding/messaginginterface/ICommand";
import { AxiosResponse } from "axios";
import { logger } from "../log";

class DeferredMessageDispatcher implements IMessageDispatcher {
  requestApprovalFromApprover(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.requestApprovalFromApprover(message)
    });
  }
  private commandCollector: CommandCollector = new CommandCollector();

  constructor(private messageDispatcher: IMessageDispatcher) {}

  createInstanceOnCAR(submodels: Submodel[]): Promise<AxiosResponse> {
    return this.messageDispatcher.createInstanceOnCAR(submodels);
  }
  sendRequestRefusedToInitiator(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.sendRequestRefusedToInitiator(message)
    });
  }
  replyError(message: InteractionMessage): void {
    var that = this;
    this.commandCollector.add({
      fn: () => that.messageDispatcher.replyError(message)
    });
  }
  sendResponseInstanceToInitiator(
    message: InteractionMessage,
    submodel: Submodel
  ): void {
    var that = this;
    this.commandCollector.add({
      fn: () =>
        that.messageDispatcher.sendResponseInstanceToInitiator(
          message,
          submodel
        )
    });
  }
  sendResponseTypeToInitiator(message: InteractionMessage, type: any): void {
    var that = this;
    this.commandCollector.add({
      fn: () =>
        that.messageDispatcher.sendResponseTypeToInitiator(message, type)
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
