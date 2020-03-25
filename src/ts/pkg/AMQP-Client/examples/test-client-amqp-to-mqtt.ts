import { IMessageBrokerClient, IMessageReceiver, Subscription, AmqpClient } from '../src/AMQPClient';

import { SapMqttClient } from './SapMqttClient';

const initializeLogger = require('../log');
let sender: IMessageBrokerClient;
let receiver: IMessageBrokerClient;
let AMQP_HOST = process.env.CORE_BROKER_HOST;
let AMQP_PORT = process.env.CORE_BROKER_PORT;

let counter = 1;
function start() {
  if (AMQP_HOST === undefined) {
    throw new Error('No CORE_BROKER_HOST found in environment');
  }
  if (AMQP_PORT === undefined) {
    throw new Error('No AMQP_PORT found in environment');
  }

  receiver = new SapMqttClient(AMQP_HOST,  'guest', 'guest');

  sender = new AmqpClient(AMQP_HOST, AMQP_PORT,  'test', 'guest', 'guest', '', true);
  let clockSet: boolean = false;
  receiver.addSubscriptionData(
    new Subscription(
      'skill/x',
      new (class MyMessageReceiver implements IMessageReceiver {
        receive(msg: string) {
          console.log('mqtt client received message:' + msg);
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
