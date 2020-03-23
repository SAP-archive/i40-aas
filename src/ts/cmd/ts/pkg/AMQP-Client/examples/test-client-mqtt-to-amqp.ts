import { IMessageBrokerClient, IMessageReceiver, Subscription, AmqpClient } from '../src/AMQPClient';

import { SapMqttClient } from './SapMqttClient';

const initializeLogger = require('../log');
let sender: IMessageBrokerClient;
let receiver: IMessageBrokerClient;
let AMQP_URL = process.env.CORE_BROKER_HOST;
let counter = 1;
function start() {
  if (AMQP_URL === undefined) {
    throw new Error('No CORE_BROKER_HOST found in environment');
  }

  sender = new SapMqttClient(AMQP_URL, 'guest', 'guest');

  receiver = new AmqpClient(
    AMQP_URL,
    'amq.topic',
    'guest',
    'guest',
    'listener',
    true
  );

  let clockSet: boolean = false;
  receiver.addSubscriptionData(
    new Subscription(
      'skill.*',
      new (class MyMessageReceiver implements IMessageReceiver {
        receive(msg: string) {
          console.log('amqp client received message:' + msg);
        }
      })()
    )
  );
  receiver.startListening();

  sender.setupPublishing();
  setTimeout(() => {
    if (clockSet) return;
    setInterval(() => {
      try {
        sender.publish('skill.x', 'ping' + counter++);
      } catch (error) {
        console.debug('Could not publish:' + error);
      }
    }, 1000);
    clockSet = true;
  }, 100);
}

start();
