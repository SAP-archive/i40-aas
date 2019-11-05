import { IFrame, Submodel } from "i40-aas-objects";

interface IMessageSender {
  replyTo(frame: IFrame, type: string, submodels?: Submodel[]): void;
  sendTo(receiverId: string, type: string, submodels?: Submodel[]): void;
  start(notifyReady?: () => void): void;
}
export { IMessageSender };
