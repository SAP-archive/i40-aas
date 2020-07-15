var messages = require('./interaction_pb');
var services = require('./interaction_grpc_pb');

var fs = require('fs');
var grpc = require('grpc');

function main() {
  var client = new services.InteractionIngressClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  jsonInteraction = JSON.parse(fs.readFileSync(__dirname + '/../../sample_interaction.json'));

  var frame = new messages.Frame()
  var request = new messages.InteractionMessage(frame)

  // messages.InteractionMessage.fromObject(jsonInteraction)
  console.log(request.toObject())

  var sender = new messages.ConversationMember()
  var sRole = new messages.Role()

  var receiver = new messages.ConversationMember()

  var rRole = new messages.Role()
  rRole.setName(jsonInteraction.frame.receiver.role.name)
  receiver.setRole(rRole)

  var rId = new messages.Identification()
  rId.setId(jsonInteraction.frame.receiver.identification.id)
  rId.setIdtype(jsonInteraction.frame.receiver.identification.idType)
  receiver.setIdentification(rId)

  request.setFrame(new messages.Frame())
  request.getFrame().setSemanticprotocol(jsonInteraction.frame.semanticProtocol)
  request.getFrame().setType(jsonInteraction.frame.type)
  request.getFrame().setReplyby(jsonInteraction.frame.replyBy)
  request.getFrame().setReceiver(receiver)
  request.getFrame().setSender(sender)
  request.getFrame().setConversationid(jsonInteraction.frame.conversationId)

  console.log(request.toObject())
  // request.setType('aasldkfjas')

  // pbjs.fromObject(jsonInteraction)

  client.sendInteractionMessage(request, function(err, response) {
    console.log('received InteractionStatusCode: ', response.getCode());
  });

}

main();
