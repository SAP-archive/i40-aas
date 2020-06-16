package main

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/jpillora/backoff"
	"github.com/rs/zerolog/log"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
	"github.com/SAP/i40-aas/src/go/pkg/interaction"
)

// ResolverMsg struct
type ResolverMsg struct {
	EgressPayload    []byte
	ReceiverURL      string
	ReceiverProtocol string
	ReceiverType     string
	ReceiverCert     string
}

// GRPCEgressConfig struct
type GRPCEgressConfig struct {
	AMQPConfig *amqpclient.Config
}

// GRPCEgress struct
type GRPCEgress struct {
	config      *GRPCEgressConfig
	grpcClients []*grpcClient
	amqpClient  *amqpclient.AMQPClient
}

// NewGRPCEgress instance
func NewGRPCEgress(cfg *GRPCEgressConfig) (*GRPCEgress, error) {
	var (
		egress *GRPCEgress
		err    error
	)

	err = cfg.validate()
	if err != nil {
		return nil, err
	}

	egress = &GRPCEgress{}
	egress.config = cfg
	egress.amqpClient, err = amqpclient.NewAMQPClient(cfg.AMQPConfig)
	if err != nil {
		return nil, err
	}

	return egress, nil
}

// Init GRPC clients and AMQP client
func (e *GRPCEgress) Init() error {
	var err error

	err = e.amqpClient.Connect()
	if err != nil {
		return err
	}

	queue := os.Getenv("CORE_EGRESS_GRPC_QUEUE")
	bindingKey := e.config.AMQPConfig.Exchange + "." + queue
	ctag := os.Getenv("CORE_EGRESS_GRPC_CTAG")

	go func() {
		for {
			deliveries := e.amqpClient.Listen(queue, bindingKey, ctag)
			for d := range deliveries {
				log.Debug().Msgf("got new %dB delivery [%v]", len(d.Body), d.DeliveryTag)

				rMsg := ResolverMsg{}

				err := json.Unmarshal(d.Body, &rMsg)
				if err != nil {
					log.Error().Err(err).Msgf("unable to Unmarshal msg to ResolverMsg: %s", string(d.Body))
					continue
				}

				iMsg, err := interaction.NewInteractionMessage(rMsg.EgressPayload)
				if err != nil {
					log.Error().Err(err).Msgf("unable to genera")
					continue
				}
				log.Debug().Msgf("got new InteractionMessage (%dB) for %q (%q) using cert %q", len(rMsg.EgressPayload), rMsg.ReceiverURL, rMsg.ReceiverType, rMsg.ReceiverCert)

				if rMsg.ReceiverType == "cloud" {
					var tlsEnabled bool
					if rMsg.ReceiverCert != "" {
						tlsEnabled = true
					} else {
						tlsEnabled = false
					}

					cfg := &GRPCClientConfig{
						URL:        rMsg.ReceiverURL,
						TLSEnabled: tlsEnabled,
						Cert:       rMsg.ReceiverCert,
					}

					c, err := e.obtainGRPCClient(cfg)
					if err != nil {
						log.Error().Err(err).Msgf("failed to obtain GRPCClient")
						continue
					}

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

	return nil
}

// Shutdown clients + amqp connection
func (e *GRPCEgress) Shutdown() error {
	var err error

	for _, c := range e.grpcClients {
		err = c.close()
		if err != nil {
			return err
		}
	}

	err = e.amqpClient.Close()
	if err != nil {
		return err
	}

	return nil
}

func (e *GRPCEgress) obtainGRPCClient(cfg *GRPCClientConfig) (*grpcClient, error) {
	for i, c := range e.grpcClients {
		if c.cfg.URL == cfg.URL {
			cState := c.conn.GetState().String()

			if cState == "READY" || cState == "CONNECTING" || cState == "IDLE" {
				log.Debug().Msgf("found existing client to reuse, state: %s", cState)
				return c, nil
			}

			log.Debug().Msgf("found client in state %s, removing from slice", cState)
			e.grpcClients[i] = e.grpcClients[len(e.grpcClients)-1] // Copy last element to index i.
			e.grpcClients[len(e.grpcClients)-1] = nil              // Erase last element (write zero value).
			e.grpcClients = e.grpcClients[:len(e.grpcClients)-1]   // Truncate slice.

			break
		}
	}

	log.Debug().Msgf("creating a new gRPC client for %s", cfg.URL)
	c, err := newGRPCClient(cfg)
	if err != nil {
		return nil, err
	}

	e.grpcClients = append(e.grpcClients, c)

	return c, nil
}

func (cfg *GRPCEgressConfig) validate() error {
	var err error

	if cfg.AMQPConfig == nil {
		err = fmt.Errorf("AMQPConfig cannot be nil")
		return err
	}

	return nil
}
