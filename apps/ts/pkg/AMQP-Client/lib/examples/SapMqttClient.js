"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mqtt = require('mqtt');
class SapMqttClient {
    constructor(mqttUrl, 
    //TODO; make it secure
    brockerUser, brokerPass) {
        this.mqttUrl = mqttUrl;
        this.brockerUser = brockerUser;
        this.brokerPass = brokerPass;
        this.client = mqtt.connect(this.mqttUrl, { protocol: 'mqtt' });
        this.client.on('connect', function () {
            console.debug('mqtt connected');
        });
    }
    isConnected() {
        throw new Error("Method not implemented.");
    }
    addSubscriptionData(subscription) {
        this.subscription = subscription;
    }
    startListening(cb) {
        var that = this;
        if (this.subscription) {
            let subscriptionTopic = this.subscription.topic;
            let messageReceiver = this.subscription.messageReceiver;
            this.client.on('connect', function () {
                console.debug('mqtt connected - now subscribing');
                that.client.subscribe(subscriptionTopic, function (err) {
                    if (err) {
                        throw new Error('Error receiving message');
                    }
                    console.debug('mqtt client subscribed to ' + subscriptionTopic);
                });
                if (cb)
                    cb();
            });
            this.client.on('message', function (topic, message) {
                if (topic === subscriptionTopic) {
                    messageReceiver.receive(message.toString());
                }
            });
        }
    }
    setupPublishing() { }
    publish(routingKey, msg) {
        this.client.publish(routingKey, msg, () => console.debug('message published from mqtt client'));
        console.debug('mqtt client sent to exchange for topic ' +
            routingKey +
            " following message'" +
            msg +
            "'");
    }
    cleanup() {
        if (this.client)
            this.client.end();
    }
}
exports.SapMqttClient = SapMqttClient;
