import { IMessageReceiver } from "./IMessageReceiver";

class Subscription {
  constructor(public topicsArray: string[], public messageReceiver: IMessageReceiver) {}
}

export { Subscription };
