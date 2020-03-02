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

	"../../pkg/amqpclient"
	"../../pkg/interaction"
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
	AMQPConfig             amqpclient.Config
	EndpointRegistryConfig EndpointRegistryConfig
}

// EndpointResolver struct
type EndpointResolver struct {
	config     Config
	amqpClient *amqpclient.AMQPClient
}

// NewEndpointResolver instance
func NewEndpointResolver(cfg Config) (resolver EndpointResolver) {
	// TODO: Check default/settings in cfg
	resolver.config = cfg

	return resolver
}

// Init EndpointResolver and AMQP client
func (r *EndpointResolver) Init() {
	r.amqpClient = amqpclient.NewAMQPClient(r.config.AMQPConfig)
	r.amqpClient.Connect()

	queue := os.Getenv("ENDPOINT_RESOLVER_AMQP_QUEUE")
	bindingKey := r.config.AMQPConfig.Exchange + "." + queue
	ctag := os.Getenv("ENDPOINT_RESOLVER_AMQP_CTAG")

	go func() {
		for {
			deliveries := r.amqpClient.Listen(queue, bindingKey, ctag)
			for d := range deliveries {
				log.Debug().Msgf("got %dB delivery: [%v]", len(d.Body), d.DeliveryTag)
				r.processGenericEgressMsg(d)
			}
			log.Warn().Msg("deliveries channel closed, restarting...")
		}
	}()
}

// Shutdown EndpointResolver
func (r *EndpointResolver) Shutdown() {
	log.Debug().Msg("entering shutdown sequence")
	r.amqpClient.Close()
	log.Debug().Msg("shutdown sequence complete")
}

func (r *EndpointResolver) processGenericEgressMsg(d amqp.Delivery) {
	msg := d.Body
	iMsg := interaction.ConvertRawJSONToInteractionMessage(msg)

	receiverRole := iMsg.Frame.Receiver.Role.Name
	receiverID := iMsg.Frame.Receiver.Identification.Id
	receiverIDType := iMsg.Frame.Receiver.Identification.IdType
	semanticprotocol := iMsg.Frame.SemanticProtocol

	registryResp := queryEndpointRegistry(receiverID, receiverIDType, receiverRole, semanticprotocol, r.config.EndpointRegistryConfig)
	if string(registryResp) == "[]" || registryResp == nil {
		log.Warn().Msgf("queryEndpointRegistry unsuccessful: %v, dropping message", string(registryResp))
	} else {
		var dat []interface{}
		if err := json.Unmarshal(registryResp, &dat); err != nil {
			log.Error().Err(err).Msg("unable to unmarshal msg")
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
					log.Error().Err(err).Msg("unable to Marshal resolverMsg")
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
					d.Nack(false, true)
				}
				d.Ack(false)
			}
		}
	}
}

func queryEndpointRegistry(receiverID string, receiverIDType string, receiverRole string, semanticProtocol string, reg EndpointRegistryConfig) []byte {
	client := &http.Client{}

	registryURL := reg.Protocol + "://" + reg.Host + ":" + strconv.Itoa(reg.Port) + reg.Route

	req, err := http.NewRequest("GET", registryURL, nil)
	if err != nil {
		log.Error().Err(err).Msg("failed to create endpoint-registry request")
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
		log.Warn().Msg("failed query attempt: (receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified")
		return nil
	}
	req.URL.RawQuery = q.Encode()

	log.Debug().Msgf("Querying: %s", req.URL.String())

	resp, err := client.Do(req)
	if err != nil {
		log.Error().Err(err).Msg("failed to query endpoint-registry")
	}

	bodyText, err := ioutil.ReadAll(resp.Body)

	log.Debug().Msgf("Got: %s", string(bodyText))

	return bodyText
}
