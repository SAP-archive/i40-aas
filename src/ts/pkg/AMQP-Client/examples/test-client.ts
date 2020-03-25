import { IMessageBrokerClient, IMessageReceiver, Subscription, AmqpClient } from '../src/AMQPClient';

let amqpClientSender: AmqpClient;
let amqpClientReceiver: AmqpClient;
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

  amqpClientSender = new AmqpClient(AMQP_HOST, AMQP_PORT, 'test', 'guest', 'guest', '');
  amqpClientReceiver = new AmqpClient(
    AMQP_HOST,AMQP_PORT,
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
