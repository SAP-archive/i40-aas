// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var interaction_pb = require('./interaction_pb.js');

function serialize_InteractionMessage(arg) {
  if (!(arg instanceof interaction_pb.InteractionMessage)) {
    throw new Error('Expected argument of type InteractionMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_InteractionMessage(buffer_arg) {
  return interaction_pb.InteractionMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_InteractionStatus(arg) {
  if (!(arg instanceof interaction_pb.InteractionStatus)) {
    throw new Error('Expected argument of type InteractionStatus');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_InteractionStatus(buffer_arg) {
  return interaction_pb.InteractionStatus.deserializeBinary(new Uint8Array(buffer_arg));
}


var InteractionIngressService = exports.InteractionIngressService = {
  sendInteractionMessage: {
    path: '/InteractionIngress/SendInteractionMessage',
    requestStream: false,
    responseStream: false,
    requestType: interaction_pb.InteractionMessage,
    responseType: interaction_pb.InteractionStatus,
    requestSerialize: serialize_InteractionMessage,
    requestDeserialize: deserialize_InteractionMessage,
    responseSerialize: serialize_InteractionStatus,
    responseDeserialize: deserialize_InteractionStatus,
  },
};

exports.InteractionIngressClient = grpc.makeGenericClientConstructor(InteractionIngressService);
