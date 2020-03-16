package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"strconv"

	"github.com/rs/zerolog/log"
	"github.com/streadway/amqp"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
	"github.com/SAP/i40-aas/src/go/pkg/interaction"
)

// ResolverMsg struct
type ResolverMsg struct {
	EgressPayload []byte
	ReceiverURL   string
	ReceiverType  string
}

// EndpointRegistryConfig struct
type EndpointRegistryConfig struct {
	Protocol string
	Host     string
	Port     int
	Route    string
	User     string
	Password string
}

// Config struct
type Config struct {
	AMQPConfig             *amqpclient.Config
	EndpointRegistryConfig *EndpointRegistryConfig
}

// EndpointResolver struct
type EndpointResolver struct {
	config     *Config
	amqpClient *amqpclient.AMQPClient
}

// NewEndpointResolver instance
func NewEndpointResolver(cfg *Config) (*EndpointResolver, error) {
	var (
		resolver *EndpointResolver
		err      error
	)

	err = cfg.validate()
	if err != nil {
		return nil, err
	}

	resolver = &EndpointResolver{}

	resolver.config = cfg
	resolver.amqpClient, err = amqpclient.NewAMQPClient(cfg.AMQPConfig)
	if err != nil {
		return nil, err
	}

	return resolver, nil
}

// Init EndpointResolver and AMQP client
func (r *EndpointResolver) Init() error {
	var err error

	err = r.amqpClient.Connect()
	if err != nil {
		return err
	}

	queue := os.Getenv("CORE_ENDPOINT_RESOLVER_QUEUE")
	bindingKey := r.config.AMQPConfig.Exchange + "." + queue
	ctag := os.Getenv("CORE_ENDPOINT_RESOLVER_CTAG")

	go func() {
		for {
			deliveries := r.amqpClient.Listen(queue, bindingKey, ctag)
			for d := range deliveries {
				log.Debug().Msgf("got new %dB delivery [%v]", len(d.Body), d.DeliveryTag)
				err := r.processGenericEgressMsg(d)
				if err != nil {
					log.Error().Err(err).Msgf("failed to process %dB delivery [%v], content: %s", len(d.Body), d.DeliveryTag, string(d.Body))
					d.Nack(false, true)
				} else {
					log.Debug().Msgf("processed %dB delivery [%v]: ACK", len(d.Body), d.DeliveryTag)
					d.Ack(false)
				}
			}
			log.Warn().Msg("deliveries channel closed, restarting...")
		}
	}()

	return nil
}

// Shutdown EndpointResolver
func (r *EndpointResolver) Shutdown() error {
	var err error

	err = r.amqpClient.Close()
	if err != nil {
		return err
	}

	return nil
}

func (r *EndpointResolver) processGenericEgressMsg(d amqp.Delivery) error {
	var (
		err              error
		receiverRole     string
		receiverID       string
		receiverIDType   string
		semanticProtocol string
	)

	msg := d.Body
	iMsg, err := interaction.NewInteractionMessage(msg)
	if err != nil {
		log.Error().Err(err).Msgf("failed to processGenericEgressMsg: %v", msg)
		return err
	}

	if iMsg.Frame != nil && iMsg.Frame.Receiver != nil {
		if iMsg.Frame.Receiver.Identification != nil {
			receiverID = iMsg.Frame.Receiver.Identification.Id
			receiverIDType = iMsg.Frame.Receiver.Identification.IdType
		} else if iMsg.Frame.Receiver.Role != nil {
			receiverRole = iMsg.Frame.Receiver.Role.Name
			semanticProtocol = iMsg.Frame.SemanticProtocol
		} else {
			err = fmt.Errorf("(receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified correctly")
			return err
		}
	} else {
		err = fmt.Errorf("(receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified correctly")
		return err
	}

	registryResp, err := queryEndpointRegistry(receiverID, receiverIDType, receiverRole, semanticProtocol, r.config.EndpointRegistryConfig)
	if err != nil {
		err = fmt.Errorf("queryEndpointRegistry unsuccessful")
		log.Error().Err(err).Msg("queryEndpointRegistry unsuccessful")
		return err
	}

	if string(registryResp) == "[]" {
		log.Warn().Msgf("queryEndpointRegistry empty: %v, dropping message", string(registryResp))
		return nil
	}

	var dat []interface{}
	if err := json.Unmarshal(registryResp, &dat); err != nil {
		log.Error().Err(err).Msg("unable to unmarshal msg")
		return err
	}

	for _, aas := range dat {
		for _, endpoint := range aas.(map[string]interface{})["endpoints"].([]interface{}) {
			urlHost := fmt.Sprintf("%v", endpoint.(map[string]interface{})["url"])
			protocol := fmt.Sprintf("%v", endpoint.(map[string]interface{})["protocol"])
			target := fmt.Sprintf("%v", endpoint.(map[string]interface{})["target"])

			resolverMsg := ResolverMsg{
				EgressPayload: msg,
				ReceiverURL:   urlHost,
				ReceiverType:  target,
			}
			payload, err := json.Marshal(resolverMsg)
			if err != nil {
				log.Error().Err(err).Msgf("unable to Marshal resolverMsg %v", resolverMsg)
				return err
			}

			var routingKey string
			if protocol == "grpc" {
				routingKey = "egress.grpc"
			} else if protocol == "http" || protocol == "https" {
				routingKey = "egress.http"
			} else {
				log.Error().Msgf("unsupported protocol %q", protocol)
			}

			err = r.amqpClient.Publish(routingKey, payload)
			if err != nil {
				log.Error().Err(err).Msgf("unable to resolve message: %s", string(payload))
				return err
			}
		}

	}
	return nil
}

func queryEndpointRegistry(receiverID string, receiverIDType string, receiverRole string, semanticProtocol string, reg *EndpointRegistryConfig) ([]byte, error) {
	var (
		err      error
		bodyText []byte
	)

	client := &http.Client{}

	registryURL := reg.Protocol + "://" + reg.Host + ":" + strconv.Itoa(reg.Port) + reg.Route

	req, err := http.NewRequest("GET", registryURL, nil)
	if err != nil {
		log.Error().Err(err).Msg("failed to create endpoint-registry request")
		return nil, err
	}
	req.SetBasicAuth(reg.User, reg.Password)
	req.Header.Add("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	q := url.Values{}
	if receiverID != "" && receiverIDType != "" {
		q.Add("receiverId", receiverID)
		q.Add("receiverIdType", receiverIDType)
	} else if receiverRole != "" && semanticProtocol != "" {
		q.Add("receiverRole", receiverRole)
		q.Add("semanticProtocol", semanticProtocol)
	} else {
		err = fmt.Errorf("failed query attempt: (receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified")
		log.Error().Err(err).Msg("failed query attempt: (receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified")
		return nil, err
	}
	req.URL.RawQuery = q.Encode()

	log.Debug().Msgf("querying: %s", req.URL.String())

	resp, err := client.Do(req)
	if err != nil {
		log.Error().Err(err).Msg("failed to query endpoint-registry")
		return nil, err
	}

	bodyText, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Error().Err(err).Msg("failed to read response body")
		return nil, err
	}

	log.Debug().Msgf("querying endpoint-registry gave: %s", string(bodyText))

	return bodyText, nil
}

func (cfg *Config) validate() error {
	var err error

	if cfg.AMQPConfig == nil {
		err = fmt.Errorf("AMQPConfig cannot be nil")
		return err
	}

	err = cfg.EndpointRegistryConfig.validate()
	if err != nil {
		return err
	}

	return nil
}

func (cfg *EndpointRegistryConfig) validate() error {
	var err error

	if cfg.Protocol == "" {
		err = fmt.Errorf("protocol has not been specified")
		return err
	}
	if cfg.Host == "" {
		err = fmt.Errorf("host has not been specified")
		return err
	}
	if cfg.Port == 0 {
		err = fmt.Errorf("port has not been specified")
		return err
	}
	if cfg.Route == "" {
		err = fmt.Errorf("route has not been specified")
		return err
	}
	if cfg.User == "" {
		err = fmt.Errorf("user has not been specified")
		return err
	}
	if cfg.Password == "" {
		err = fmt.Errorf("password has not been specified")
		return err
	}

	return nil
}
