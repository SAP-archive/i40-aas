import { IMessageReceiver } from "./IMessageReceiver";

class Subscription {
  constructor(public topic: string, public messageReceiver: IMessageReceiver) {}
}

export { Subscription };
