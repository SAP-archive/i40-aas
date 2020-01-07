import { Request, Response, NextFunction } from "express";
import { Interaction } from "i40-aas-objects";
import { publishInteractionToBroker } from "./RoutingController";
import { validateInteractionFrame } from "../../middleware/checks";
import { BrokerInteractionTopic } from "./messaging/BrokerInteractionTopic";
import * as logger from "winston";
import { HTTP404Error, HTTP401Error } from "../../utils/httpErrors";

export default [
  {
    path: "/interaction",
    method: "post",
    handler: [
      validateInteractionFrame,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.debug("request received");

        try {
          //TODO: consider if we need confirmation of publishing the request to broker

          let interactionReq: Interaction = new Interaction(req.body);
          let semanticProtocol = interactionReq.frame.semanticProtocol;
          let receiverRole: string = interactionReq.frame.receiver.role.name;
          let type = interactionReq.frame.type;

          /**
          * Build the topic name that follows the schema
          * Topic -> protocol:receiver_role:message_type
          * */

          let topicName = new BrokerInteractionTopic(
                    semanticProtocol,
                    receiverRole,
                    type
          ).getTopic();

          logger.debug("[AMQP] topic name " + topicName);

          try {
                    const result = await publishInteractionToBroker(
                    topicName,
                    req.body
                    );
                    res.status(200).send(result);
          } catch (error) {
                    next(new Error("Internal Server Error"));
          }
        } catch (e) {
          if (!e.isBoom) {
                    next(new Error("Unspecified Error Occured"));
          } else {
                    next(e);
          }
        }
      }
    ]
  }
];
