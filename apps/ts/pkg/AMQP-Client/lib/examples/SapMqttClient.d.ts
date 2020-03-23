import { IMessageBrokerClient, Subscription } from '../src/AMQPClient';
declare class SapMqttClient implements IMessageBrokerClient {
    private mqttUrl;
    private brockerUser;
    private brokerPass;
    isConnected(): boolean;
    private subscription;
    private client;
    addSubscriptionData(subscription: Subscription): void;
    constructor(mqttUrl: string, brockerUser: string, brokerPass: string);
    startListening(cb?: (() => void) | undefined): void;
    setupPublishing(): void;
    publish(routingKey: string, msg: string): void;
    cleanup(): void;
}
export { SapMqttClient };
