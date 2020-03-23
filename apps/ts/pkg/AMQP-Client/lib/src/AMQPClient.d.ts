import { Connection, Options } from 'amqplib/callback_api';
declare class Subscription {
    topic: string;
    messageReceiver: IMessageReceiver;
    constructor(topic: string, messageReceiver: IMessageReceiver);
}
interface IMessageReceiver {
    receive: (msg: string) => void;
}
interface IMessageBrokerClient {
    addSubscriptionData(subscription: Subscription): void;
    startListening(cb?: () => void): void;
    publish(routingKey: string, msg: string): void;
    setupPublishing(cb?: () => void): void;
    isConnected(): boolean;
}
declare class AmqpClient implements IMessageBrokerClient {
    private ampqUrl;
    private brokerExchange;
    private brokerUser;
    private brokerPass;
    private listenerQueue;
    private reconnectAfterMilliSecs?;
    private myConn;
    private listenerQName;
    listenerCounter: number;
    retryCounter: number;
    successCounter: number;
    start: number;
    static MQTT_EXCHANGE: string;
    useMqtt: boolean;
    private destroyed;
    isConnected(): boolean;
    constructor(ampqUrl: string, brokerExchange: string, brokerUser: string, brokerPass: string, listenerQueue: string, useMqtt?: boolean, reconnectAfterMilliSecs?: number | undefined);
    static sleep(millis: number): Promise<unknown>;
    connectToBroker(url: string | Options.Connect, socketOptions: any, callback: (err: any, connection: Connection) => void): void;
    killConnection(callback?: (err: any) => void): void;
    private connect;
    addSubscriptionData(subscription: Subscription): void;
    private doSubscription;
    private connectAndDoSubscription;
    startListening(): void;
    setupPublishing(cb?: () => void): void;
    publish(routingKey: string, msg: string): void;
    cleanup(): void;
}
export { IMessageReceiver, IMessageBrokerClient, AmqpClient, Subscription };
