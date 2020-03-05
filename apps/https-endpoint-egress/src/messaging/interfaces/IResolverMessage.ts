import { IInteractionMessage as string } from 'i40-aas-objects';

interface IResolverMessage {
  EgressPayload: string;
  ReceiverURL: string;
  ReceiverType: string;
}

class ResolverMessage implements IResolverMessage {
  EgressPayload: string;
  ReceiverURL: string;
  ReceiverType: string;

  constructor(obj: IResolverMessage) {
    this.EgressPayload = obj.EgressPayload;
    this.ReceiverURL = obj.ReceiverURL;
    this.ReceiverType = obj.ReceiverType;
  }
}
export { IResolverMessage, ResolverMessage };
