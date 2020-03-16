"use strict";
exports.__esModule = true;
var AMQPClient_1 = require("../src/AMQPClient");
var amqpClientSender;
var amqpClientReceiver;
var AMQP_URL = process.env.RABBITMQ_AMQP_HOST;
var counter = 1;
function start() {
    if (AMQP_URL === undefined) {
        throw new Error('No RABBITMQ_AMQP_HOST found in environment');
    }
    amqpClientSender = new AMQPClient_1.AmqpClient(AMQP_URL, 'test', 'guest', 'guest', '');
    amqpClientReceiver = new AMQPClient_1.AmqpClient(AMQP_URL, 'test', 'guest', 'guest', 'listener');
    var clockSet = false;
    amqpClientReceiver.addSubscriptionData(new AMQPClient_1.Subscription('skill.*', new (/** @class */ (function () {
        function MyMessageReceiver() {
        }
        MyMessageReceiver.prototype.receive = function (msg) {
            console.log('amqp client received message:' + msg);
        };
        return MyMessageReceiver;
    }()))()));
    amqpClientReceiver.startListening();
    amqpClientSender.setupPublishing();
    if (clockSet)
        return;
    setInterval(function () {
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
