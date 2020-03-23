"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqp = require("amqplib/callback_api");
class AmqpConnectionDetails {
    constructor() {
        this.connectionClosed = true;
    }
}
class Subscription {
    constructor(topic, messageReceiver) {
        this.topic = topic;
        this.messageReceiver = messageReceiver;
    }
}
exports.Subscription = Subscription;
//TODO: set proper time gap for connection retries (6s currently).
class AmqpClient {
    //TODO: make a parameter object
    constructor(ampqUrl, brokerExchange, brokerUser, brokerPass, listenerQueue, useMqtt, reconnectAfterMilliSecs) {
        this.ampqUrl = ampqUrl;
        this.brokerExchange = brokerExchange;
        this.brokerUser = brokerUser;
        this.brokerPass = brokerPass;
        this.listenerQueue = listenerQueue;
        this.reconnectAfterMilliSecs = reconnectAfterMilliSecs;
        this.myConn = new AmqpConnectionDetails();
        this.listenerCounter = 0;
        this.retryCounter = 0;
        this.successCounter = 0;
        this.useMqtt = false;
        this.destroyed = false;
        this.start = Date.now();
        this.listenerQName = listenerQueue;
        console.debug('AmpqClient created');
        let that = this;
        process.on('SIGINT', function () {
            that.cleanup();
        });
        if (useMqtt !== undefined) {
            this.useMqtt = useMqtt;
        }
    }
    isConnected() {
        return this.myConn.connectionClosed ? false : true;
    }
    static sleep(millis) {
        return new Promise(resolve => setTimeout(resolve, millis));
    }
    //proxy call easily mockable for testing
    connectToBroker(url, socketOptions, callback) {
        amqp.connect(url, socketOptions, callback);
    }
    killConnection(callback) {
        if (this.myConn.connection)
            this.myConn.connection.close(callback);
    }
    connect(cb) {
        let opt = {
            credentials: require('amqplib').credentials.plain(this.brokerUser, this.brokerPass)
        };
        let url = ' amqp://' + this.ampqUrl + '?heartbeat=60';
        console.debug('Connecting to ' + url);
        var that = this;
        try {
            this.connectToBroker(url, opt, function (err, conn) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.error('[AMQP] Error:' + err.message);
                        console.info('Waiting to reconnect');
                        let timeout;
                        if (that.reconnectAfterMilliSecs)
                            timeout = that.reconnectAfterMilliSecs;
                        else
                            timeout = 6000;
                        yield AmqpClient.sleep(timeout);
                        console.info('reconnecting. Call count:' + that.retryCounter++);
                        that.connect(cb);
                        return;
                    }
                    //no error
                    console.info('[AMQP] definitely connected');
                    that.myConn.connection = conn;
                    that.myConn.connectionClosed = false;
                    conn.on('close', function () {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (that.destroyed)
                                return;
                            console.error('[AMQP] connection lost, reconnecting. Time:' +
                                (Date.now() - that.start));
                            that.myConn.connectionClosed = true;
                            that.connectAndDoSubscription(() => {
                                that.setupPublishing(() => console.info('Successfully connected after drop count:' +
                                    ++that.successCounter +
                                    '. Time:' +
                                    (Date.now() - that.start)));
                            });
                        });
                    });
                    //}
                    cb();
                });
            });
        }
        catch (error) {
            console.error('Error when trying to connect:' + error.message);
        }
    }
    addSubscriptionData(subscription) {
        this.myConn.subscription = subscription;
    }
    doSubscription(afterSubscriptionDone) {
        if (!this.myConn.subscription) {
            if (afterSubscriptionDone)
                afterSubscriptionDone();
            return;
        }
        if (this.myConn.connectionClosed) {
            console.error('Cannot subscribe as connection closed');
            return;
        }
        if (!this.myConn.connection) {
            throw new Error('Message listener could not be started due to the connection not being set up');
        }
        var that = this;
        this.myConn.connection.createChannel(function (err, ch) {
            if (err) {
                console.error('Error thrown:' + err.message);
                throw err;
            }
            that.myConn.pubChannel = ch;
            //TODO: durable correct?
            ch.assertExchange(that.brokerExchange, 'topic', { durable: true });
            if (that.useMqtt) {
                ch.assertExchange(AmqpClient.MQTT_EXCHANGE, 'topic', { durable: true });
                ch.bindExchange(that.brokerExchange, AmqpClient.MQTT_EXCHANGE, '*', {}, () => console.error('Mqtt exchange bound'));
            }
            ch.assertQueue(that.listenerQName, { exclusive: false }, function (error2, q) {
                if (error2) {
                    console.error('Error thrown:' + error2.message);
                    throw error2;
                    //return;
                }
                if (that.myConn.subscription) {
                    console.info('Listener started. Waiting for messages in ' +
                        q.queue +
                        ' for topic ' +
                        that.myConn.subscription.topic +
                        '. Call count: ' +
                        ++that.listenerCounter);
                    console.debug('Binding ' +
                        q.queue +
                        ' to exchange ' +
                        that.brokerExchange +
                        ' for topic ' +
                        that.myConn.subscription.topic);
                    ch.bindQueue(q.queue, that.brokerExchange, that.myConn.subscription.topic, {}, () => {
                        console.debug('q ' + q.queue + ' bound to exchange');
                    });
                    ch.consume(q.queue, function (msg) {
                        if (msg === null) {
                            throw Error('Null message received!');
                        }
                        console.debug(that.listenerQueue + ' received message on queue ' + q.queue);
                        if (that.myConn.subscription) {
                            that.myConn.subscription.messageReceiver.receive(msg.content.toString());
                        }
                        else {
                            console.error('Attempting to set up a subscription even though none was provided.');
                        }
                    }, { noAck: true } //
                    );
                    if (afterSubscriptionDone)
                        afterSubscriptionDone();
                    //if (cb) cb();
                }
                else {
                    console.error('Attempting to set up a subscription even though none was provided.');
                }
            });
        });
    }
    //==1.connect and 2.subscribe
    connectAndDoSubscription(afterSubscriptionDone) {
        if (this.myConn.connection == undefined || this.myConn.connectionClosed) {
            this.connect(() => {
                this.doSubscription(afterSubscriptionDone);
            });
        }
        else {
            this.doSubscription(afterSubscriptionDone);
        }
    }
    startListening() {
        if (this.myConn.subscription) {
            this.connectAndDoSubscription();
        }
    }
    setupPublishing(cb) {
        let that = this;
        function publishSetup() {
            console.debug('Called setupPublishing');
            if (!that.myConn.connection) {
                throw new Error('Message publisher could not be started due to the connection not being set up');
            }
            console.debug('Creating channel');
            that.myConn.connection.createChannel(function (err, ch) {
                if (err) {
                    throw new Error(err.message);
                }
                that.myConn.pubChannel = ch;
                console.debug('Channel ready. Asserting exchange');
                that.myConn.pubChannel.assertExchange(that.brokerExchange, 'topic', {
                    durable: true
                });
                console.debug('Exchange ' + that.brokerExchange + ' set up for topics');
                if (that.useMqtt) {
                    that.myConn.pubChannel.assertExchange(AmqpClient.MQTT_EXCHANGE, 'topic', {
                        durable: true
                    });
                    console.debug('exchange asserted');
                    that.myConn.pubChannel.bindExchange(AmqpClient.MQTT_EXCHANGE, //destination
                    that.brokerExchange, //source
                    '#', {}, () => {
                        console.debug('bound exchange. All messages arriving at ' +
                            that.brokerExchange +
                            ' will be forwarded to ' +
                            AmqpClient.MQTT_EXCHANGE);
                        console.debug('Calling publish callback');
                        if (cb)
                            cb();
                    });
                }
                else {
                    console.debug('Calling publish callback');
                    if (cb)
                        cb();
                }
            });
        }
        if (that.myConn.connection == undefined || that.myConn.connectionClosed) {
            that.connect(publishSetup);
        }
        else {
            publishSetup();
        }
    }
    //TODO: messages get lost if the broker goes down, adjust durability? have queue at client side?
    //TODO: it should take an object (not a string) and stringify it here to make testing easier
    //TODO: make sure setupPublish called before, or call it explicitly
    publish(routingKey, msg) {
        if (this.myConn.connectionClosed) {
            throw new Error('Cannot publish to closed channel');
        }
        if (!this.myConn.pubChannel) {
            throw new Error('No publication channel available');
        }
        this.myConn.pubChannel.publish(this.brokerExchange, routingKey, Buffer.from(msg));
        console.debug('amqp client sent to exchange ' +
            this.brokerExchange +
            ' with topic ' +
            routingKey +
            " the following message'" +
            msg +
            "'");
    }
    cleanup() {
        console.debug('Cleaning up');
        this.destroyed = true;
        if (this.myConn.connection && !this.myConn.connectionClosed) {
            this.myConn.connection.close(); //this takes time
            this.myConn.connectionClosed = true;
            console.debug('Closed connection');
        }
    }
}
exports.AmqpClient = AmqpClient;
AmqpClient.MQTT_EXCHANGE = 'amq.topic';
