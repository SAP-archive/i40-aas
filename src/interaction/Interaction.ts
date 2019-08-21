import { Frame } from './Frame';

interface IInteractionMessage {
    frame: Frame;
    interactionElements: Array<Object>;
}

class Interaction implements IInteractionMessage {
    frame: Frame;
    interactionElements: Object[];

    constructor(obj: Interaction) {
        this.frame = obj.frame;
        this.interactionElements = obj.interactionElements;
    }
}
export { IInteractionMessage, Interaction };
