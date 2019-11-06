

interface IMessageBrokerClient {

  publish(routingKey: string, msg: string): void;
  setupPublishing(cb?: () => void):void;
  isConnected():boolean;
}

export { IMessageBrokerClient };