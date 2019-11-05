import { IInteractionMessage } from "i40-aas-objects";
import { WebClient } from "../../WebClient/WebClient";

interface IMessageHandler {
  sendInteractionReplyToAAS(
    receiverURL: URL,
    webClient: WebClient,
    message: IInteractionMessage
  ): void;

  receivedUnintelligibleMessage(message: IInteractionMessage): void;
}
export { IMessageHandler };
