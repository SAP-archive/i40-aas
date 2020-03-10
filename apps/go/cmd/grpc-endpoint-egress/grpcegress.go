package main

import (
	"encoding/json"
	"os"
	"time"

	"github.com/jpillora/backoff"
	"github.com/rs/zerolog/log"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
	"github.com/SAP/i40-aas/src/go/pkg/interaction"
)

// ResolverMsg struct
type ResolverMsg struct {
	EgressPayload []byte
	ReceiverURL   string
	ReceiverType  string
}

// GRPCEgressConfig struct
type GRPCEgressConfig struct {
	AMQPConfig amqpclient.Config
}

// GRPCEgress struct
type GRPCEgress struct {
	config      GRPCEgressConfig
	grpcClients []*grpcClient
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
	e.amqpClient.Connect()

	queue := os.Getenv("GRPC_ENDPOINT_EGRESS_AMQP_QUEUE")
	bindingKey := e.config.AMQPConfig.Exchange + "." + queue
	ctag := os.Getenv("GRPC_ENDPOINT_EGRESS_AMQP_CTAG")

	// go e.clearIdleClients()

	go func() {
		for {
			deliveries := e.amqpClient.Listen(queue, bindingKey, ctag)
			for d := range deliveries {
				log.Debug().Msgf("got new %dB delivery [%v]", len(d.Body), d.DeliveryTag)

				rMsg := ResolverMsg{}

				err := json.Unmarshal(d.Body, &rMsg)
				if err != nil {
					log.Error().Err(err).Msgf("unable to Unmarshal msg to ResolverMsg: %s", string(d.Body))
				}

				iMsg := interaction.ConvertRawJSONToInteractionMessage(rMsg.EgressPayload)
				log.Debug().Msgf("got new InteractionMessage (%dB) for %q (%q)", len(rMsg.EgressPayload), rMsg.ReceiverURL, rMsg.ReceiverType)

				if rMsg.ReceiverType == "cloud" {
					cfg := GRPCClientConfig{
						URL:      rMsg.ReceiverURL,
						RootCert: "",
					}

					c := e.obtainGRPCClient(cfg)
					b := &backoff.Backoff{
						Min:    10 * time.Millisecond,
						Max:    10 * time.Second,
						Factor: 2,
						Jitter: true,
					}

					c.SendInteractionMessage(iMsg, b)
					log.Debug().Msgf("sent InteractionMessage (%dB) to %s, (client state: %q)", len(rMsg.EgressPayload), c.cfg.URL, c.conn.GetState().String())
				} else if rMsg.ReceiverType == "edge" {
					log.Warn().Msgf("NOT IMPLEMENTED: receiver type: %s", rMsg.ReceiverType)
				} else {
					log.Error().Err(err).Msgf("unknown receiver type: %s", rMsg.ReceiverType)
				}

				d.Ack(false)
			}
			log.Warn().Msg("deliveries channel closed, restarting...")
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

func (e *GRPCEgress) obtainGRPCClient(cfg GRPCClientConfig) *grpcClient {
	for _, c := range e.grpcClients {
		if c.cfg.URL == cfg.URL {
			return c
		}
	}

	log.Debug().Msgf("creating a new gRPC client for %s", cfg.URL)
	c := newGRPCClient(cfg)
	e.grpcClients = append(e.grpcClients, c)

	return c
}

// TODO
func (e *GRPCEgress) clearIdleClients() {
	// for {
	// 	time.Sleep(1 * time.Second)
	// 	for i, c := range e.grpcClients {
	// 		log.Info().Msgf("Client %s:%d (index %d) is in state: %s", c.config.Host, c.config.Port, i, c.conn.GetState().String())
	// 	}
	// }
}
