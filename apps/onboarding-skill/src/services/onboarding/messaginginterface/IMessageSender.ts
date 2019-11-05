import { IFrame, SubmodelInterface } from "i40-aas-objects";

interface IMessageSender {
  replyTo(frame: IFrame, type: string, submodels?: SubmodelInterface[]): void;
  sendTo(frame: IFrame, submodels?: SubmodelInterface[]): void;
  start(notifyReady?: () => void): void;
}
export { IMessageSender };
