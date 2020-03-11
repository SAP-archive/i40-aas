package main

import (
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
)

// GRPCIngressConfig struct
type GRPCIngressConfig struct {
	AMQPConfig    *amqpclient.Config
	GRPCSrvConfig *GRPCServerConfig
}

// GRPCIngress struct
type GRPCIngress struct {
	config     *GRPCIngressConfig
	grpcServer *grpcServer
	amqpClient *amqpclient.AMQPClient
}

// NewGRPCIngress instance
func NewGRPCIngress(cfg *GRPCIngressConfig) (*GRPCIngress, error) {
	var (
		ingress *GRPCIngress
		err     error
	)

	err = cfg.validate()
	if err != nil {
		return nil, err
	}

	ingress = &GRPCIngress{}

	ingress.config = cfg

	ingress.amqpClient, err = amqpclient.NewAMQPClient(cfg.AMQPConfig)
	if err != nil {
		return nil, err
	}

	ingress.grpcServer, err = newGRPCServer(cfg.GRPCSrvConfig)
	if err != nil {
		return nil, err
	}

	return ingress, nil
}

// Init GRPC server and AMQP client
func (i *GRPCIngress) Init() error {
	var err error

	i.amqpClient.Connect()

	err = i.grpcServer.init()
	if err != nil {
		return err
	}

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
			routingKey := i.config.AMQPConfig.Exchange + "." + f.SemanticProtocol + "." + f.Receiver.Role.Name + "." + f.Type

			err = i.amqpClient.Publish(routingKey, jsonMessage)
			if err != nil {
				ia.Nack()
			} else {
				ia.Ack()
			}
		}

		// TODO restart!
	}()
	return nil
}

// Shutdown the Ingress
func (i *GRPCIngress) Shutdown() error {
	var err error

	i.grpcServer.close()

	err = i.amqpClient.Close()
	if err != nil {
		return err
	}

	return nil
}

func (cfg *GRPCIngressConfig) validate() error {
	var err error

	if cfg.AMQPConfig == nil {
		err = fmt.Errorf("AMQPConfig cannot be nil")
		return err
	}
	if cfg.GRPCSrvConfig == nil {
		err = fmt.Errorf("GRPCSrvConfig cannot be nil")
		return err
	}

	return nil
}
