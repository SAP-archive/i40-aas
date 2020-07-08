import { IInteractionMessage as string } from 'i40-aas-objects';

interface IResolverMessage {
  EgressPayload: string;
  ReceiverURL: string;
  ReceiverProtocol: string;
  ReceiverType: string;
  ReceiverTLSCert: string;
  ReceiverUser: string;
  ReceiverPassword: string;
}

class ResolverMessage implements IResolverMessage {
  EgressPayload: string;
  ReceiverURL: string;
  ReceiverProtocol: string;
  ReceiverType: string;
  ReceiverTLSCert: string;
  ReceiverUser: string;
  ReceiverPassword: string;

  constructor(obj: IResolverMessage) {
    this.EgressPayload = obj.EgressPayload;
    this.ReceiverURL = obj.ReceiverURL;
    this.ReceiverProtocol = obj.ReceiverProtocol;
    this.ReceiverType = obj.ReceiverType;
    this.ReceiverTLSCert = obj.ReceiverTLSCert;
    this.ReceiverUser = obj.ReceiverUser;
    this.ReceiverPassword = obj.ReceiverPassword;
  }
}
export { IResolverMessage, ResolverMessage };
