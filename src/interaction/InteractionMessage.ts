import { Frame, IFrame } from './Frame';
import { Submodel, SubmodelInterface } from '../identifiables/Submodel';

interface IInteractionMessage {
    frame: IFrame;
    interactionElements: Array<SubmodelInterface>;
}

class InteractionMessage implements IInteractionMessage {
    frame: IFrame;
    interactionElements: Array<SubmodelInterface>;

    constructor(obj: InteractionMessage) {
        this.frame = obj.frame;
        this.interactionElements = obj.interactionElements;
    }
}
export { IInteractionMessage, InteractionMessage };
