import { logger } from '../../log';
import { AxiosResponse } from 'axios';
import { InteractionMessage } from 'i40-aas-objects';
import { ISkillContext } from '../../base/statemachineinterface/ISkillContext';
import { Utils } from '../../base/Utils';

import { RestClient } from './RestClient';
import { MessageDispatcher } from './MessageDispatcher';

class SkillActionMap {
  constructor(
    private messageDispatcher: MessageDispatcher,
    private restClient: RestClient
  ) {}

  sendCreationErrorToOperator(context: ISkillContext, event: any) {
    logger.debug('Received error. Now sending error back');
    let md = this.messageDispatcher;
    Utils.logRequestError(event.data, logger);
    if (!event.data.response) {
      md.sendErrorToOperator(context.message);
    } else {
      switch (event.data.response.status) {
        case 400:
          md.sendNotUnderstoodToOperator(context.message);
          break;
        case 401:
          md.sendRequestRefusedToOperator(context.message);
          break;
        default:
          md.sendErrorToOperator(context.message);
      }
    }
  }

  requestApprovalFromApprover(context: ISkillContext, event: any) {
    logger.debug('Calling requestApprovalFromApprover');
    this.messageDispatcher.requestApprovalFromApprover(context.message);
  }

  sendResponseToOperatorAndRequestType(context: ISkillContext, event: any) {
    logger.debug('Calling sendResponseInstanceToOperator');
    this.messageDispatcher.sendResponseInstanceToOperator(
      context.message,
      context.message.interactionElements[0]
    );
    logger.debug('Calling requestTypeFromManufacturer');
    this.messageDispatcher.requestTypeFromManufacturer('', {});
    //TODO:send actual type to actual url
  }

  async createInstance(
    context: ISkillContext,
    event: any
  ): Promise<AxiosResponse> {
    logger.debug('SkillActionMap::createInstance called');
    //TODO await?
    return this.restClient.createInstanceOnCAR(
      context.message.interactionElements
    );
  }

  sendResponseInstanceToOperator(context: ISkillContext, event: any) {
    logger.debug('onDone called');
    return this.messageDispatcher.sendResponseInstanceToOperator(
      context.message,
      context.message.interactionElements[0]
    );
  }

  //called in case manufacturer rejects the request
  sendRequestRefusedToOperator(context: ISkillContext, event: any) {
    let message = context.message as InteractionMessage;
    this.messageDispatcher.sendRequestRefusedToOperator(message);
  }

  sendErrorToOperator(context: ISkillContext, event: any) {
    let message = context.message as InteractionMessage;
    this.messageDispatcher.sendErrorToOperator(message);
  }

  sendResponseTypeToOperator(context: ISkillContext, event: any) {
    let message = context.message as InteractionMessage;
    //TODO: get response type from message
    this.messageDispatcher.sendResponseTypeToOperator(message, {});
  }
}
export { SkillActionMap };
