import { IInitializer } from '../../base/statemachineinterface/IInitializer';

import { InteractionMessage } from 'i40-aas-objects';

import { ISkillContext } from '../../base/statemachineinterface/ISkillContext';

import { SkillActionMap } from './SkillActionMap';
import { ExternalRestServiceCaller } from './ExternalRestServiceCaller';
import { IAasMessageDispatcher } from '../../base/messaginginterface/IAasMessageDispatcher';
import { AasMessageDispatcher } from './AasMessageDispatcher';

class Initializer implements IInitializer {
  getPlainAasMessageDispatcher(): IAasMessageDispatcher {
    return this.plainMessageDispatcher;
  }
  constructor(
    private plainMessageDispatcher: AasMessageDispatcher,
    private restClient: ExternalRestServiceCaller,
    private configuration: object
  ) {}
  public createContextForStateMachine(
    message: InteractionMessage,
    wrappedMessageDispatcher: any
  ): ISkillContext {
    return {
      message: message,
      actionMap: new SkillActionMap(wrappedMessageDispatcher, this.restClient),
      configuration: this.configuration
    };
  }
}
export { Initializer };
