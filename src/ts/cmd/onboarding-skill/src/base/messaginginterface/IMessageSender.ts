import { IFrame } from "i40-aas-objects";

interface IMessageSender {
  replyTo(frame: IFrame, type: string, submodels?: object[]): void;
  sendTo(frame: IFrame, submodels?: object[]): void;
  start(notifyReady?: () => void): void;
}
export { IMessageSender };
