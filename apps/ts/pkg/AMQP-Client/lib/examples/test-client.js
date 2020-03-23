"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AMQPClient_1 = require("../src/AMQPClient");
let amqpClientSender;
let amqpClientReceiver;
let AMQP_URL = process.env.RABBITMQ_AMQP_HOST;
let counter = 1;
function start() {
    if (AMQP_URL === undefined) {
        throw new Error('No RABBITMQ_AMQP_HOST found in environment');
    }
    amqpClientSender = new AMQPClient_1.AmqpClient(AMQP_URL, 'test', 'guest', 'guest', '');
    amqpClientReceiver = new AMQPClient_1.AmqpClient(AMQP_URL, 'test', 'guest', 'guest', 'listener');
    let clockSet = false;
    amqpClientReceiver.addSubscriptionData(new AMQPClient_1.Subscription('skill.*', new (class MyMessageReceiver {
        receive(msg) {
            console.log('amqp client received message:' + msg);
        }
    })()));
    amqpClientReceiver.startListening();
    amqpClientSender.setupPublishing();
    if (clockSet)
        return;
    setInterval(() => {
        try {
            amqpClientSender.publish('skill.x', 'ping' + counter++);
        }
        catch (error) {
            console.debug('Could not publish:' + error);
        }
    }, 1000);
    clockSet = true;
}
start();
