var messages = require('./interaction_pb');
var services = require('./interaction_grpc_pb');

var fs = require('fs');
var grpc = require('grpc');
var protobuf = require("protobufjs");

function main() {
  var client = new services.InteractionIngressClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  jsonInteraction = JSON.parse(fs.readFileSync(__dirname + '/../../sample_interaction.json'));

  protobuf.load(__dirname + '/../../../interaction.proto', (err, root) => {
    if (err)
      throw err;

    var interactionMessage = root.lookupType("InteractionMessage");

    var errMsg = interactionMessage.verify(jsonInteraction);
    if (errMsg)
      throw Error(errMsg);

    var message = interactionMessage.create(jsonInteraction);
    var protobuffer = interactionMessage.encode(message).finish();

    var request = messages.InteractionMessage.deserializeBinary(protobuffer);

    client.sendInteractionMessage(request, function(err, response) {
      console.log('received InteractionStatusCode: ', response.getCode());
    });
  })

}

main();
