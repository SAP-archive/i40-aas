import { ISkillContext } from "./statemachineinterface/ISkillContext";
import { IMessageDispatcher } from "./messaginginterface/IMessageDispatcher";
import { logger } from "../../log";
import { AxiosResponse } from "axios";
import { InteractionMessage } from "i40-aas-objects";

class SkillActionMap {
  constructor(private messageDispatcher: IMessageDispatcher) {}

  private logRequestError(error: any) {
    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      logger.debug(
        "The request was made and the server responded with a status code that falls out of the range of 2xx"
      );
      logger.debug("Status " + error.response.status);
      logger.debug("Headers " + error.response.headers);
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      logger.debug("The request was made but no response was received");
      logger.debug("Request: " + error.request); //This might print out the password
    } else {
      // Something happened in setting up the request and triggered an Error
      logger.debug(
        "Something happened in setting up the request and triggered an Error"
      );
      logger.debug("Error", error.message);
    }
    //all relevant fields have been logged, no need to log entire error again
    //logger.debug(error);
  }

  sendErrorToOperator(context: ISkillContext, event: any) {
    logger.debug("Received error. Now sending error back");
    let md = this.messageDispatcher;
    this.logRequestError(event.data);
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
    logger.debug("Calling requestApprovalFromApprover");
    this.messageDispatcher.requestApprovalFromApprover(context.message);
  }

  //TODO: why context.message and context.message...
  sendResponseToOperatorAndRequestType(context: ISkillContext, event: any) {
    logger.debug("Calling sendResponseInstanceToOperator");
    this.messageDispatcher.sendResponseInstanceToOperator(
      context.message,
      context.message.interactionElements[0]
    );
    logger.debug("Calling requestTypeFromManufacturer");
    this.messageDispatcher.requestTypeFromManufacturer("", {});
    //TODO:send actual type to actual url
  }
  createInstance(context: ISkillContext, event: any): Promise<AxiosResponse> {
    logger.debug("SkillActionMap::createInstance called");
    return this.messageDispatcher.createInstanceOnCAR(
      context.message.interactionElements
    );
  }
  sendResponseInstanceToOperator(context: ISkillContext, event: any) {
    logger.debug("onDone called");
    return this.messageDispatcher.sendResponseInstanceToOperator(
      context.message,
      context.message.interactionElements[0]
    );
  }

  //called in case manufacturer rejects the request
  //TODO: write test to make sure message sent to right role with right message type in this case
  sendRequestRefusedToOperator(context: ISkillContext, event: any) {
    let message = context.message as InteractionMessage;
    this.messageDispatcher.sendRequestRefusedToOperator(message);
  }

  sendErrorToInitiator(context: ISkillContext, event: any) {
    let message = context.message as InteractionMessage;
    this.messageDispatcher.replyError(message);
  }

  sendResponseTypeToInitiator(context: ISkillContext, event: any) {
    let message = context.message as InteractionMessage;
    //TODO: get response type from message
    this.messageDispatcher.sendResponseTypeToOperator(message, {});
  }
}
export { SkillActionMap };
