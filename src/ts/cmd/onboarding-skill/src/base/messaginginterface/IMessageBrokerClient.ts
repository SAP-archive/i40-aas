import { IMessageReceiver } from './IMessageReceiver';
import { SubscriptionDto } from './SubscriptionDto';

interface IMessageBrokerClient {
  addSubscriptionData(subscription: SubscriptionDto): void;
  startListening(cb?: () => void): void;
  publish(routingKey: string, msg: string): void;
  setupPublishing(cb?: () => void): void;
}

export { IMessageBrokerClient };
