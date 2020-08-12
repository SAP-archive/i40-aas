var messages = require('./interaction_pb');
var services = require('./interaction_grpc_pb');

var grpc = require('grpc');

/**
 * Implements the SendInteractionMessage RPC method.
 */
function sendInteractionMessage(call, callback) {
  console.log("invocation by " + JSON.stringify(call.request.toObject()));

  var reply = new messages.InteractionStatus();
  reply.setCode(200);

  callback(null, reply);
}

/**
 * Starts an RPC server that receives requests for the InteractionIngress service
 */
function main() {
  var server = new grpc.Server();

  server.addService(services.InteractionIngressService, {
    sendInteractionMessage: sendInteractionMessage
  });

  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  server.start();
}

main();
