"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var amqp = require("amqplib/callback_api");
var AmqpConnectionDetails = /** @class */ (function () {
    function AmqpConnectionDetails() {
        this.connectionClosed = true;
    }
    return AmqpConnectionDetails;
}());
var Subscription = /** @class */ (function () {
    function Subscription(topic, messageReceiver) {
        this.topic = topic;
        this.messageReceiver = messageReceiver;
    }
    return Subscription;
}());
exports.Subscription = Subscription;
//TODO: set proper time gap for connection retries (6s currently).
var AmqpClient = /** @class */ (function () {
    //TODO: make a parameter object
    function AmqpClient(ampqUrl, brokerExchange, brokerUser, brokerPass, uniqueListenerId, useMqtt, reconnectAfterMilliSecs) {
        this.ampqUrl = ampqUrl;
        this.brokerExchange = brokerExchange;
        this.brokerUser = brokerUser;
        this.brokerPass = brokerPass;
        this.uniqueListenerId = uniqueListenerId;
        this.reconnectAfterMilliSecs = reconnectAfterMilliSecs;
        this.myConn = new AmqpConnectionDetails();
        this.listenerCounter = 0;
        this.retryCounter = 0;
        this.successCounter = 0;
        this.useMqtt = false;
        this.destroyed = false;
        this.start = Date.now();
        this.listenerQName = uniqueListenerId + ':submodels:publishRequests';
        console.debug('AmpqClient created');
        var that = this;
        process.on('SIGINT', function () {
            that.cleanup();
        });
        if (useMqtt !== undefined) {
            this.useMqtt = useMqtt;
        }
    }
    AmqpClient.sleep = function (millis) {
        return new Promise(function (resolve) { return setTimeout(resolve, millis); });
    };
    //proxy call easily mockable for testing
    AmqpClient.prototype.connectToBroker = function (url, socketOptions, callback) {
        amqp.connect(url, socketOptions, callback);
    };
    AmqpClient.prototype.killConnection = function (callback) {
        if (this.myConn.connection)
            this.myConn.connection.close(callback);
    };
    AmqpClient.prototype.connect = function (cb) {
        var opt = {
            credentials: require('amqplib').credentials.plain(this.brokerUser, this.brokerPass)
        };
        var url = ' amqp://' + this.ampqUrl + '?heartbeat=60';
        console.debug('Connecting to ' + url);
        var that = this;
        try {
            this.connectToBroker(url, opt, function (err, conn) {
                return __awaiter(this, void 0, void 0, function () {
                    var timeout;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!err) return [3 /*break*/, 2];
                                console.error('[AMQP] Error:' + err.message);
                                console.info('Waiting to reconnect');
                                timeout = void 0;
                                if (that.reconnectAfterMilliSecs)
                                    timeout = that.reconnectAfterMilliSecs;
                                else
                                    timeout = 6000;
                                return [4 /*yield*/, AmqpClient.sleep(timeout)];
                            case 1:
                                _a.sent();
                                console.info('reconnecting. Call count:' + that.retryCounter++);
                                that.connect(cb);
                                return [2 /*return*/];
                            case 2:
                                //no error
                                console.info('[AMQP] definitely connected');
                                that.myConn.connection = conn;
                                that.myConn.connectionClosed = false;
                                conn.on('close', function () {
                                    return __awaiter(this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            if (that.destroyed)
                                                return [2 /*return*/];
                                            console.error('[AMQP] connection lost, reconnecting. Time:' +
                                                (Date.now() - that.start));
                                            that.myConn.connectionClosed = true;
                                            that.connectAndDoSubscription(function () {
                                                that.setupPublishing(function () {
                                                    return console.info('Successfully connected after drop count:' +
                                                        ++that.successCounter +
                                                        '. Time:' +
                                                        (Date.now() - that.start));
                                                });
                                            });
                                            return [2 /*return*/];
                                        });
                                    });
                                });
                                //}
                                cb();
                                return [2 /*return*/];
                        }
                    });
                });
            });
        }
        catch (error) {
            console.error('Error when trying to connect:' + error.message);
        }
    };
    AmqpClient.prototype.addSubscriptionData = function (subscription) {
        this.myConn.subscription = subscription;
    };
    AmqpClient.prototype.doSubscription = function (afterSubscriptionDone) {
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
                ch.bindExchange(that.brokerExchange, AmqpClient.MQTT_EXCHANGE, '*', {}, function () { return console.error('Mqtt exchange bound'); });
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
                    ch.bindQueue(q.queue, that.brokerExchange, that.myConn.subscription.topic, {}, function () {
                        console.debug('q ' + q.queue + ' bound to exchange');
                    });
                    ch.consume(q.queue, function (msg) {
                        if (msg === null) {
                            throw Error('Null message received!');
                        }
                        console.debug(that.uniqueListenerId + ' received message on queue ' + q.queue);
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
    };
    //==1.connect and 2.subscribe
    AmqpClient.prototype.connectAndDoSubscription = function (afterSubscriptionDone) {
        var _this = this;
        if (this.myConn.connection == undefined || this.myConn.connectionClosed) {
            this.connect(function () {
                _this.doSubscription(afterSubscriptionDone);
            });
        }
        else {
            this.doSubscription(afterSubscriptionDone);
        }
    };
    AmqpClient.prototype.startListening = function () {
        if (this.myConn.subscription) {
            this.connectAndDoSubscription();
        }
    };
    AmqpClient.prototype.setupPublishing = function (cb) {
        var that = this;
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
                    '#', {}, function () {
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
    };
    //TODO: messages get lost if the broker goes down, adjust durability? have queue at client side?
    //TODO: it should take an object (not a string) and stringify it here to make testing easier
    //TODO: make sure setupPublish called before, or call it explicitly
    AmqpClient.prototype.publish = function (routingKey, msg) {
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
    };
    AmqpClient.prototype.cleanup = function () {
        console.debug('Cleaning up');
        this.destroyed = true;
        if (this.myConn.connection && !this.myConn.connectionClosed) {
            this.myConn.connection.close(); //this takes time
            this.myConn.connectionClosed = true;
            console.debug('Closed connection');
        }
    };
    AmqpClient.MQTT_EXCHANGE = 'amq.topic';
    return AmqpClient;
}());
exports.AmqpClient = AmqpClient;
