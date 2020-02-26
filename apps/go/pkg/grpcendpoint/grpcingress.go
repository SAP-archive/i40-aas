package grpcendpoint

import (
	"context"

	"github.com/rs/zerolog/log"

	amqpclient "../amqpclient"
	utils "../utils"
)

// GRPCIngressConfig struct
type GRPCIngressConfig struct {
	AMQPConfig amqpclient.Config
	GRPCConfig GRPCServerConfig
}

// GRPCIngress struct
type GRPCIngress struct {
	config     GRPCIngressConfig
	grpcServer grpcServer
	amqpClient amqpclient.AMQPClient
}

// NewGRPCIngress instance
func NewGRPCIngress(cfg GRPCIngressConfig) (ingress GRPCIngress) {
	// TODO: Check default/settings in cfg
	ingress.config = cfg
	return ingress
}

// Init GRPC server and AMQP client
func (i *GRPCIngress) Init() {
	i.amqpClient = amqpclient.NewAMQPClient(i.config.AMQPConfig)
	i.grpcServer = newGRPCServer(i.config.GRPCConfig)

	i.amqpClient.Init()
	go i.grpcServer.init()

	go func() {
		for iMsg := range i.grpcServer.iMessageQueue {
			log.Debug().Msgf("Got new interactionMessage: %v", iMsg)
			jsonMessage := utils.ConvertInteractionMessageToRawJSON(iMsg)

			f := iMsg.Frame
			routingKey := f.SemanticProtocol + "." + f.Receiver.Role.Name + "." + f.Type

			i.amqpClient.Publish(routingKey, jsonMessage)
		}
	}()
}

// Shutdown the Ingress
func (i *GRPCIngress) Shutdown(ctx context.Context) {
	i.grpcServer.close()
	i.amqpClient.Close()
}
