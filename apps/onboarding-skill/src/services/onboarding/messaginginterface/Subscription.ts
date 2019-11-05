import { IMessageReceiver } from "./IMessageReceiver";

class Subscription {
  constructor(public topic: string, public messageReceiver: IMessageReceiver) {}
}

/*
class AmqpSubscription extends Subscription {
  constructor(
    topic: string,
    messageReceiver: IMessageReceiver,
    public brokerExchange: string
  ) {
    super(topic, messageReceiver);
  }
}*/

export { Subscription };
