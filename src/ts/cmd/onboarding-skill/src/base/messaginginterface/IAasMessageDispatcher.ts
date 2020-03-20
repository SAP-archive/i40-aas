import { InteractionMessage } from 'i40-aas-objects';

interface IAasMessageDispatcher {
  replyNotUnderstood(message: InteractionMessage): void;
  replyError(message: InteractionMessage): void;
}

export { IAasMessageDispatcher };
