package main

import (
	"github.com/rs/zerolog/log"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
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
	i.amqpClient.Connect()

	i.grpcServer = newGRPCServer(i.config.GRPCConfig)
	go i.grpcServer.init()

	go func() {
		log.Debug().Msg("starting to consume InteractionMessages")
		for ia := range i.grpcServer.iQueue {
			jsonMessage, err := ia.Msg.ToRawJSON()
			if err != nil {
				log.Error().Err(err).Msgf("unable to process ia.Msg of Interaction %v", ia)
				continue
			}
			log.Debug().Msgf("Got new InteractionMessage: %s", string(jsonMessage))

			f := ia.Msg.Frame
			routingKey := f.SemanticProtocol + "." + f.Receiver.Role.Name + "." + f.Type

			err = i.amqpClient.Publish(routingKey, jsonMessage)
			if err != nil {
				ia.Nack()
			} else {
				ia.Ack()
			}
		}

		// TODO restart!
	}()
}

// Shutdown the Ingress
func (i *GRPCIngress) Shutdown() {
	log.Debug().Msg("entering shutdown sequence")
	i.grpcServer.close()
	i.amqpClient.Close()
	log.Debug().Msg("shutdown sequence complete")
}
