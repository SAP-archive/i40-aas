import { IMessageReceiver } from './IMessageReceiver';
import { Subscription } from './Subscription';

interface IMessageBrokerClient {
  addSubscriptionData(subscription: Subscription): void;
  startListening(cb?: () => void): void;
  publish(routingKey: string, msg: string): void;
  setupPublishing(cb?: () => void): void;
}

export { IMessageBrokerClient };
