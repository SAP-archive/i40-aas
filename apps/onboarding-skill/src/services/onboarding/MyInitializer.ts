import { IInitializer } from '../../base/statemachineinterface/IInitializer';

import { InteractionMessage } from 'i40-aas-objects';

import { ISkillContext } from '../../base/statemachineinterface/ISkillContext';

import { MySkillActionMap } from './MySkillActionMap';
import { MyExternalRestServiceCaller } from './MyExternalRestServiceCaller';
import { IAasMessageDispatcher } from '../../base/messaginginterface/IAasMessageDispatcher';
import { MyAasMessageDispatcher } from './MyAasMessageDispatcher';

class MyInitializer implements IInitializer {
  getPlainAasMessageDispatcher(): IAasMessageDispatcher {
    return this.plainMessageDispatcher;
  }
  constructor(
    private plainMessageDispatcher: MyAasMessageDispatcher,
    private restClient: MyExternalRestServiceCaller,
    private configuration: object
  ) {}
  public createContextForStateMachine(
    message: InteractionMessage,
    wrappedMessageDispatcher: any
  ): ISkillContext {
    return {
      message: message,
      actionMap: new MySkillActionMap(
        wrappedMessageDispatcher,
        this.restClient
      ),
      configuration: this.configuration
    };
  }
}
export { MyInitializer };
