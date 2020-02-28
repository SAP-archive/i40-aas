package grpcendpoint

import (
	"context"
	"encoding/json"
	"os"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	amqpclient "../amqpclient"
	endpointresolver "../endpointresolver"
	interaction "../interaction"
)

// GRPCEgressConfig struct
type GRPCEgressConfig struct {
	AMQPConfig amqpclient.Config
}

// GRPCEgress struct
type GRPCEgress struct {
	config      GRPCEgressConfig
	grpcClients []grpcClient
	amqpClient  *amqpclient.AMQPClient
}

// NewGRPCEgress instance
func NewGRPCEgress(cfg GRPCEgressConfig) (egress GRPCEgress) {
	// TODO: Check default/settings in cfg

	egress.config = cfg
	return egress
}

// Init GRPC clients and AMQP client
func (e *GRPCEgress) Init() {
	e.amqpClient = amqpclient.NewAMQPClient(e.config.AMQPConfig)

	queue := os.Getenv("GRPC_ENDPOINT_EGRESS_AMQP_QUEUE")
	bindingKey := e.config.AMQPConfig.Exchange + "." + queue
	ctag := os.Getenv("GRPC_ENDPOINT_EGRESS_AMQP_CTAG")
	go e.amqpClient.Listen(queue, bindingKey, ctag)

	go e.clearIdleClients()

	go func() {
		for msg := range e.amqpClient.MsgChan {
			rMsg := endpointresolver.ResolverMsg{}

			err := json.Unmarshal(msg, &rMsg)
			if err != nil {
				log.Error().Err(err).Msgf("unable to Unmarshal msg to ResolverMsg: %s", string(msg))
			}

			iMsg := interaction.ConvertRawJSONToInteractionMessage(rMsg.EgressPayload)

			if rMsg.ReceiverType == "cloud" {

				// TODO: Rework, this will 100% result in errors!
				host := strings.Split(rMsg.ReceiverURL, ":")[0]
				port, _ := strconv.Atoi(strings.Split(rMsg.ReceiverURL, ":")[1])

				cfg := GRPCClientConfig{
					Host: host,
					Port: port,
				}

				var c grpcClient
				c = e.obtainGRPCClient(cfg)

				c.interactionClient.UploadInteractionMessage(context.Background(), iMsg)
			} else if rMsg.ReceiverType == "edge" {
				log.Warn().Msgf("NOT IMPLEMENTED: receiver type: %s", rMsg.ReceiverType)
			} else {
				log.Error().Err(err).Msgf("unknown receiver type: %s", rMsg.ReceiverType)
			}
		}
	}()
}

// Shutdown clients + amqp connection
func (e *GRPCEgress) Shutdown() {
	log.Debug().Msg("entering shutdown sequence")
	for _, c := range e.grpcClients {
		c.close()
	}
	e.amqpClient.Close()
	log.Debug().Msg("shutdown sequence complete")
}

func (e *GRPCEgress) obtainGRPCClient(cfg GRPCClientConfig) grpcClient {
	var c grpcClient

	for _, client := range e.grpcClients {
		if client.config.Host+strconv.Itoa(client.config.Port) == cfg.Host+strconv.Itoa(cfg.Port) {
			c = client
		}
	}

	if reflect.DeepEqual(c, grpcClient{}) {
		c = newGRPCClient(cfg)
		c.init()
		e.grpcClients = append(e.grpcClients, c)
	}

	return c
}

func (e *GRPCEgress) clearIdleClients() {
	for {
		time.Sleep(1 * time.Second)
		for i, c := range e.grpcClients {
			log.Info().Msgf("Client %s:%d (index %d) is in state: %s", c.config.Host, c.config.Port, i, c.conn.GetState().String())
		}
	}
}
