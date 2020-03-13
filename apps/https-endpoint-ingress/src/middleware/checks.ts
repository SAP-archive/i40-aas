
import { Request, Response, NextFunction } from "express";
import { HTTP404Error, HTTP400Error, HTTP422Error } from "../utils/httpErrors";
import { IInteractionMessage, InteractionMessage } from "i40-aas-objects";
import { logger } from "../utils/log";


export const validateInteractionFrame = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    logger.debug("RECEIVED Message: " + req.body)

    try {
      let interactionReq:IInteractionMessage = new InteractionMessage(req.body);

      //the required fields of the frame that should not be empty
      let semanticProtocol:string = interactionReq.frame.semanticProtocol;
      let receiverRole:string = interactionReq.frame.receiver.role.name;
      let senderRole:string = interactionReq.frame.receiver.role.name;
      let type:string = interactionReq.frame.type;
      let conversationId:string = interactionReq.frame.conversationId;

      next();
    } catch (error) {
      throw new HTTP422Error("Missing required fields in Interaction Frame: "+ error);
    }
};
