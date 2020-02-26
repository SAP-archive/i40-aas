package grpcendpoint

import (
	"context"
	"encoding/json"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"

	amqpclient "../amqpclient"
	endpointresolver "../endpointresolver"
	utils "../utils"
)

// GRPCEgressConfig struct
type GRPCEgressConfig struct {
	AMQPConfig amqpclient.Config
}

// GRPCEgress struct
type GRPCEgress struct {
	config      GRPCEgressConfig
	grpcClients []grpcClient
	amqpClient  amqpclient.AMQPClient
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
	e.amqpClient.Init()

	bindingKey := e.config.AMQPConfig.Exchange + "." + e.config.AMQPConfig.Queue
	ctag := "grpc-endpoint-egress"
	go e.amqpClient.Listen(bindingKey, ctag)

	go e.clearIdleClients()

	go func() {
		for msg := range e.amqpClient.MsgChan {
			rMsg := endpointresolver.ResolverMsg{}

			err := json.Unmarshal(msg, &rMsg)
			if err != nil {
				log.Error().Err(err).Msgf("unable to Unmarshal msg to ResolverMsg: %s", string(msg))
			}

			iMsg := utils.ConvertRawJSONToInteractionMessage(rMsg.EgressPayload)

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
func (e *GRPCEgress) Shutdown(ctx context.Context) {
	for _, c := range e.grpcClients {
		c.close(ctx)
	}
	e.amqpClient.Close()
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
