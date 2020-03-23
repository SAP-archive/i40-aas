"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AMQPClient_1 = require("../src/AMQPClient");
const SapMqttClient_1 = require("./SapMqttClient");
const initializeLogger = require('../log');
let sender;
let receiver;
let AMQP_URL = process.env.RABBITMQ_AMQP_HOST;
let counter = 1;
function start() {
    if (AMQP_URL === undefined) {
        throw new Error('No RABBITMQ_AMQP_HOST found in environment');
    }
    sender = new SapMqttClient_1.SapMqttClient(AMQP_URL, 'guest', 'guest');
    receiver = new AMQPClient_1.AmqpClient(AMQP_URL, 'amq.topic', 'guest', 'guest', 'listener', true);
    let clockSet = false;
    receiver.addSubscriptionData(new AMQPClient_1.Subscription('skill.*', new (class MyMessageReceiver {
        receive(msg) {
            console.log('amqp client received message:' + msg);
        }
    })()));
    receiver.startListening();
    sender.setupPublishing();
    setTimeout(() => {
        if (clockSet)
            return;
        setInterval(() => {
            try {
                sender.publish('skill.x', 'ping' + counter++);
            }
            catch (error) {
                console.debug('Could not publish:' + error);
            }
        }, 1000);
        clockSet = true;
    }, 100);
}
start();
