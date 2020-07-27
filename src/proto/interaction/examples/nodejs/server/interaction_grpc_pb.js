// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var interaction_pb = require('./interaction_pb.js');

function serialize_sap_i40aas_interaction_InteractionMessage(arg) {
  if (!(arg instanceof interaction_pb.InteractionMessage)) {
    throw new Error('Expected argument of type sap.i40aas.interaction.InteractionMessage');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_sap_i40aas_interaction_InteractionMessage(buffer_arg) {
  return interaction_pb.InteractionMessage.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_sap_i40aas_interaction_InteractionStatus(arg) {
  if (!(arg instanceof interaction_pb.InteractionStatus)) {
    throw new Error('Expected argument of type sap.i40aas.interaction.InteractionStatus');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_sap_i40aas_interaction_InteractionStatus(buffer_arg) {
  return interaction_pb.InteractionStatus.deserializeBinary(new Uint8Array(buffer_arg));
}


var InteractionIngressService = exports.InteractionIngressService = {
  sendInteractionMessage: {
    path: '/sap.i40aas.interaction.InteractionIngress/SendInteractionMessage',
    requestStream: false,
    responseStream: false,
    requestType: interaction_pb.InteractionMessage,
    responseType: interaction_pb.InteractionStatus,
    requestSerialize: serialize_sap_i40aas_interaction_InteractionMessage,
    requestDeserialize: deserialize_sap_i40aas_interaction_InteractionMessage,
    responseSerialize: serialize_sap_i40aas_interaction_InteractionStatus,
    responseDeserialize: deserialize_sap_i40aas_interaction_InteractionStatus,
  },
};

exports.InteractionIngressClient = grpc.makeGenericClientConstructor(InteractionIngressService);
