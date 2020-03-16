import { IMessageBrokerClient, IMessageReceiver, Subscription, AmqpClient } from '../src/AMQPClient';

let amqpClientSender: AmqpClient;
let amqpClientReceiver: AmqpClient;
let AMQP_URL = process.env.RABBITMQ_AMQP_HOST;

let counter = 1;
function start() {
  if (AMQP_URL === undefined) {
    throw new Error('No RABBITMQ_AMQP_HOST found in environment');
  }
  amqpClientSender = new AmqpClient(AMQP_URL, 'test', 'guest', 'guest', '');
  amqpClientReceiver = new AmqpClient(
    AMQP_URL,
    'test',
    'guest',
    'guest',
    'listener'
  );
  let clockSet: boolean = false;
  amqpClientReceiver.addSubscriptionData(
    new Subscription(
      'skill.*',
      new (class MyMessageReceiver implements IMessageReceiver {
        receive(msg: string) {
          console.log('amqp client received message:' + msg);
        }
      })()
    )
  );
  amqpClientReceiver.startListening();

  amqpClientSender.setupPublishing();

  if (clockSet) return;
  setInterval(() => {
    try {
      amqpClientSender.publish('skill.x', 'ping' + counter++);
    } catch (error) {
      console.debug('Could not publish:' + error);
    }
  }, 1000);
  clockSet = true;
}

start();
