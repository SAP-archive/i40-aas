import { IMessageReceiver } from './IMessageReceiver';

class SubscriptionDto {
  constructor(public topic: string, public messageReceiver: IMessageReceiver) {}
}

export { SubscriptionDto };
