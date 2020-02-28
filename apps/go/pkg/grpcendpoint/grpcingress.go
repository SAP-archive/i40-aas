package grpcendpoint

import (
	"github.com/rs/zerolog/log"

	amqpclient "../amqpclient"
	interaction "../interaction"
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
	amqpClient *amqpclient.AMQPClient
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

	go i.grpcServer.init()

	go func() {
		for iMsg := range i.grpcServer.iMessageQueue {
			log.Debug().Msgf("Got new interactionMessage: %v", iMsg)
			jsonMessage := interaction.ConvertInteractionMessageToRawJSON(iMsg)

			f := iMsg.Frame
			routingKey := f.SemanticProtocol + "." + f.Receiver.Role.Name + "." + f.Type

			i.amqpClient.Publish(routingKey, jsonMessage)
		}
	}()
}

// Shutdown the Ingress
func (i *GRPCIngress) Shutdown() {
	log.Debug().Msg("entering shutdown sequence")
	i.grpcServer.close()
	i.amqpClient.Close()
	log.Debug().Msg("shutdown sequence complete")
}
