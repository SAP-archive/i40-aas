package grpcendpoint

import (
	"context"

	interaction "../../../proto/interaction"
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

	// TODO
	// loop over range of grpcserver iMsg channel
	// convert InteractionMessages to JSON
	// Publish JSON to AMQP Exchange
	// Return proper InteractionStatus
}

// Shutdown the Ingress
func (i *GRPCIngress) Shutdown(ctx context.Context) {
	i.grpcServer.close()
	i.amqpClient.close()
}

func interactionMessageToJSON(interaction.InteractionMessage) {
	// TODO: return JSON
}
