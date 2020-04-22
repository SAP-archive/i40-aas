import { Skill } from '../Skill';
import { AmqpClient, Subscription } from 'AMQP-Client/lib/AmqpClient';
import { InteractionMessage } from 'i40-aas-objects';
import { IMessageReceiver } from '../messaginginterface/IMessageReceiver';
const logger = require('aas-logger/lib/log');

class MessageInterpreter implements IMessageReceiver {
  constructor(private skill: Skill, private amqpClient: AmqpClient) {}

  start(topic: string) {
    this.amqpClient.addSubscriptionData(new Subscription(topic, this));
    this.amqpClient.startListening();
  }

  private handleUnintelligibleMessage(
    message: InteractionMessage,
    missingData: string[]
  ) {
    logger.error(
      'Missing necessary data, ' +
        missingData.toString() +
        ', in incoming message:' +
        JSON.stringify(message)
    );
    this.skill.receivedUnintelligibleMessage(message);
  }

  private handleUnactionableMessage(message: string, missingData?: string[]) {
    if (missingData) {
      logger.error(
        'Cannot react to this message as the following data, ' +
          missingData.toString() +
          ', is missing: ' +
          message
      );
    } else {
      logger.error('Cannot react to this unparsable message:' + message);
    }
  }

  private validateRequired(data: InteractionMessage): boolean {
    //essential validation passed: senderId exists
    let senderRole: string | undefined;
    let messageType: string | undefined;
    let conversationId: string | undefined;
    try {
      senderRole = data.frame.sender.role.name;
      messageType = data.frame.type;
      conversationId = data.frame.conversationId;

      let requiredAndMissingData: string[] = [
        senderRole,
        messageType,
        conversationId,
      ].filter((e) => e === undefined || e.length === 0);

      if (requiredAndMissingData.length > 0) {
        this.handleUnintelligibleMessage(data, requiredAndMissingData);
        return false;
      }
    } catch (error) {
      logger.error(
        'Error received during validation of required fields:' + error
      );
      this.skill.preprocessingError(data);
      return false;
    }
    return true;
  }

  private validateEssential(msg: string): InteractionMessage | undefined {
    try {
      let data = JSON.parse(msg);
      let essentialDataGiven: boolean =
        (data.frame.sender.identification &&
          data.frame.sender.identification.id) ||
        data.frame.sender.role
          ? true
          : false;
      if (!essentialDataGiven) {
        this.handleUnactionableMessage(msg, ['a sender role or id']);
        return undefined;
      }
      return data;
    } catch (error) {
      logger.error(
        'General error received during validation of essential fields:' + error
      );
      this.handleUnactionableMessage(msg);
      return undefined;
    }
  }

  receive(msg: string) {
    //logger.info("Got msg: " + msg.content.toString());
    let message = this.validateEssential(msg);
    if (!message) {
      logger.error(
        'An invalid message was received but it does not include enough information to send any kind of response.'
      );
      return;
    }

    if (this.validateRequired(message)) {
      this.skill.applyEvent(
        message.frame.type.toUpperCase() +
          '_FROM_' +
          message.frame.sender.role.name.toUpperCase(),
        message.frame.conversationId,
        message
      );
    } //all logging/error reply actions should be performed in the validation process
  }
}

export { MessageInterpreter, IMessageReceiver };
