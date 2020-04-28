import { Request, Response, NextFunction } from 'express';
import { publishInteractionToBroker } from './RoutingController';
import { validateInteractionFrame } from '../../middleware/checks';
import { BrokerInteractionTopic } from './messaging/BrokerInteractionTopic';

import { IInteractionMessage, InteractionMessage } from 'i40-aas-objects';

const logger = require('aas-logger/lib/log');

export default [
  {
    path: '/interaction',
    method: 'post',
    handler: [
      validateInteractionFrame,
      async (req: Request, res: Response, next: NextFunction) => {
        logger.debug('request received');

        try {
          //TODO: consider if we need confirmation of publishing the request to broker
          let topicPrefix = 'ingress';
          let interactionReq: IInteractionMessage = new InteractionMessage(
            req.body
          );
          let semanticProtocol = interactionReq.frame.semanticProtocol;
          let receiverRole: string = interactionReq.frame.receiver.role.name;
          let type = interactionReq.frame.type;

          /**
           * Build the topic name that follows the schema
           * Topic -> protocol:receiver_role:message_type
           * */

          let topicName = new BrokerInteractionTopic(
            topicPrefix,
            semanticProtocol,
            receiverRole,
            type
          ).getTopic();

          logger.debug('[AMQP] topic name ' + topicName);

          try {
            const result = await publishInteractionToBroker(
              topicName,
              req.body
            );
            res.status(200).send(result);
          } catch (error) {
            next(new Error('Internal Server Error'));
          }
        } catch (e) {
          if (!e.isBoom) {
            next(new Error('Unspecified Error Occured'));
          } else {
            next(e);
          }
        }
      },
    ],
  },
];
