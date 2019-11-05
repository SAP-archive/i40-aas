import { Submodel } from "i40-aas-objects";

import { AxiosResponse } from "axios";
import { InteractionMessage } from "i40-aas-objects";
import { SubmodelInterface } from "i40-aas-objects/dist/src/identifiables/Submodel";

interface IMessageDispatcher {
  createInstanceOnCAR(submodels: SubmodelInterface[]): Promise<AxiosResponse>;

  sendRequestRefusedToInitiator(message: InteractionMessage): void;

  replyError(message: InteractionMessage): void;

  sendResponseInstanceToInitiator(
    message: InteractionMessage,
    submodel: SubmodelInterface
  ): void;

  sendResponseTypeToInitiator(message: InteractionMessage, type: any): void;

  requestTypeFromManufacturer(receiverId: string, typeDescription: any): void;

  replyNotUnderstood(message: InteractionMessage): void;

  requestApprovalFromApprover(message: InteractionMessage): void;
}

export { IMessageDispatcher };
