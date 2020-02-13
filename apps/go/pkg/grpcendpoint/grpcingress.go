package grpcendpoint

import (
	"context"
	"log"

	interaction "../../../proto/interaction"
	"github.com/golang/protobuf/jsonpb"
)

// GRPCIngress struct
type GRPCIngress struct {
	config     GRPCIngressConfig
	grpcServer grpcServer
	amqpClient amqpClient
}

// NewGRPCIngress instance
func NewGRPCIngress(cfg GRPCIngressConfig) (ingress GRPCIngress) {
	// TODO: Check default/settings in cfg
	ingress.config = cfg
	return ingress
}

// Init GRPC server and AMQP client
func (i *GRPCIngress) Init() {
	i.amqpClient = newAMQPClient(i.config.AMQPConfig)
	i.grpcServer = newGRPCServer(i.config.GRPCConfig)

	i.amqpClient.init()
	go i.grpcServer.init()

	go func() {
		for iMsg := range i.grpcServer.iMessageQueue {
			jsonMessage := convertInteractionMessageToRawJSON(iMsg)

			f := iMsg.Frame
			routingKey := f.SemanticProtocol + "." + f.Receiver.Role.Name + "." + f.Type

			i.amqpClient.publish(routingKey, jsonMessage)
		}
	}()
}

// Shutdown the Ingress
func (i *GRPCIngress) Shutdown(ctx context.Context) {
	i.grpcServer.close()
	i.amqpClient.close()
}

func convertInteractionMessageToRawJSON(protoMessage *interaction.InteractionMessage) []byte {
	protoFrame := protoMessage.Frame
	marshaler := jsonpb.Marshaler{}
	jsonFrame, err := marshaler.MarshalToString(protoFrame)
	if err != nil {
		log.Printf("unable to MarshalToString protoFrame: %s", err)
	}

	interactionElementsRaw := protoMessage.InteractionElements

	jsonString := "{\"frame\":" + jsonFrame + ",\"interactionElements\":" + string(interactionElementsRaw) + "}"
	jsonRaw := []byte(jsonString)

	return jsonRaw
}
