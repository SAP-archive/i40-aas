import { Submodel } from 'i40-aas-objects';

import { AxiosResponse } from 'axios';
import { InteractionMessage, SubmodelInterface } from 'i40-aas-objects';

interface IMessageDispatcher {
  createInstanceOnCAR(submodels: SubmodelInterface[]): Promise<AxiosResponse>;

  replyRequestRefused(message: InteractionMessage): void;

  replyError(message: InteractionMessage): void;

  sendResponseInstanceToOperator(
    message: InteractionMessage,
    submodel: SubmodelInterface
  ): void;

  sendResponseTypeToOperator(message: InteractionMessage, type: any): void;

  requestTypeFromManufacturer(receiverId: string, typeDescription: any): void;

  replyNotUnderstood(message: InteractionMessage): void;

  requestApprovalFromApprover(message: InteractionMessage): void;

  sendErrorToOperator(message: InteractionMessage): void;

  sendRequestRefusedToOperator(message: InteractionMessage): void;

  sendNotUnderstoodToOperator(message: InteractionMessage): void;
}

export { IMessageDispatcher };
