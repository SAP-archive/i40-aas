import { InteractionMessage } from 'i40-aas-objects';

import { ISkillContext } from './ISkillContext';
import { IAasMessageDispatcher } from '../messaginginterface/IAasMessageDispatcher';

interface IInitializer {
  createContextForStateMachine(
    message: InteractionMessage,
    messageDispatcher: any
  ): ISkillContext;

  getPlainAasMessageDispatcher(): IAasMessageDispatcher;
}
export { IInitializer };
