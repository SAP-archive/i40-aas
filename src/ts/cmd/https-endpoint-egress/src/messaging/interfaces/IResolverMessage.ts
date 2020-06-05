import { IInteractionMessage as string } from 'i40-aas-objects';

interface IResolverMessage {
  EgressPayload: string;
  ReceiverURL: string;
  ReceiverProtocol: string;
  ReceiverType: string;
  ReceiverCert: string;
}

class ResolverMessage implements IResolverMessage {
  EgressPayload: string;
  ReceiverURL: string;
  ReceiverProtocol: string;
  ReceiverType: string;
  ReceiverCert: string;

  constructor(obj: IResolverMessage) {
    this.EgressPayload = obj.EgressPayload;
    this.ReceiverURL = obj.ReceiverURL;
    this.ReceiverProtocol = obj.ReceiverProtocol;
    this.ReceiverType = obj.ReceiverType;
    this.ReceiverCert = obj.ReceiverCert;
  }
}
export { IResolverMessage, ResolverMessage };
