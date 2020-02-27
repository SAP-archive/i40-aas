import { IInteractionMessage } from 'i40-aas-objects';

interface IResolverMessage {
    interactionMessage: IInteractionMessage;
    receiverURL:   string;
    receiverType:  string;
}

class ResolverMessage implements IResolverMessage {
  interactionMessage: IInteractionMessage;
  receiverURL:   string;
  receiverType:  string;

    constructor(obj: IResolverMessage) {
        this.interactionMessage=  obj.interactionMessage;
        this.receiverURL= obj.receiverURL;
        this.receiverType = obj.receiverType;
    }
}
export { IResolverMessage, ResolverMessage };
