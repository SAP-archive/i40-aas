import {
  IMessageBrokerClient,
  IMessageReceiver,
  Subscription
} from '../src/AmqpClient';
import { Client } from 'mqtt';

var mqtt = require('mqtt');

class SapMqttClient implements IMessageBrokerClient {
  isConnected(): boolean {
    throw new Error('Method not implemented.');
  }
  private subscription: Subscription | undefined;
  private client: Client;

  addSubscriptionData(subscription: Subscription) {
    this.subscription = subscription;
  }

  constructor(
    private mqttHost: string,
    //TODO; make it secure
    private brockerUser: string,
    private brokerPass: string
  ) {
    this.client = mqtt.connect(this.mqttHost, { protocol: 'mqtt' });
    this.client.on('connect', function() {
      console.debug('mqtt connected');
    });
  }

  startListening(cb?: (() => void) | undefined): void {
    var that = this;
    if (this.subscription) {
      let subscriptionTopic: string = this.subscription.topic;
      let messageReceiver: IMessageReceiver = this.subscription.messageReceiver;

      this.client.on('connect', function() {
        console.debug('mqtt connected - now subscribing');
        that.client.subscribe(subscriptionTopic, function(err) {
          if (err) {
            throw new Error('Error receiving message');
          }
          console.debug('mqtt client subscribed to ' + subscriptionTopic);
        });
        if (cb) cb();
      });

      this.client.on('message', function(topic, message) {
        if (topic === subscriptionTopic) {
          messageReceiver.receive(message.toString());
        }
      });
    }
  }

  setupPublishing(): void {}

  publish(routingKey: string, msg: string): void {
    this.client.publish(routingKey, msg, () =>
      console.debug('message published from mqtt client')
    );
    console.debug(
      'mqtt client sent to exchange for topic ' +
        routingKey +
        " following message'" +
        msg +
        "'"
    );
  }

  public cleanup(): void {
    if (this.client) this.client.end();
  }
}

export { SapMqttClient };
