package main

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
  "strconv"
  "strings"
  "github.com/golang/protobuf/jsonpb"

	"github.com/SAP/i40-aas/src/go/pkg/interaction"

	"github.com/rs/zerolog/log"
	"github.com/streadway/amqp"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
)

// ResolverMsg struct
type ResolverMsg struct {
	EgressPayload    []byte
	ReceiverURL      string
	ReceiverType     string
	ReceiverTarget   string
	ReceiverTLSCert  *string
	ReceiverUser     *string
	ReceiverPassword *string
}

// EndpointRegistryConfig struct
type EndpointRegistryConfig struct {
	Protocol    string
	CrtFilePath string
	Host        string
	Port        int
	User        string
	Password    string
}

// Config struct
type Config struct {
	AMQPConfig             *amqpclient.Config
	EndpointRegistryConfig *EndpointRegistryConfig
	Ctag                   string
	BindingKey             string
	Queue                  string
}

// EndpointResolver struct
type EndpointResolver struct {
	config     *Config
	amqpClient *amqpclient.AMQPClient
	deliveries <-chan amqp.Delivery
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

	go func() {
		for {
			r.deliveries = r.amqpClient.Listen(r.config.Queue, r.config.BindingKey, r.config.Ctag)
			for d := range r.deliveries {
				r.processDelivery(d)
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

func (r *EndpointResolver) processDelivery(d amqp.Delivery) {
	var (
		err error
	)

	log.Debug().Msgf("got new %dB delivery [%v]", len(d.Body), d.DeliveryTag)
	err = r.processGenericEgressMsg(d)
	if err != nil {
		log.Error().Err(err).Msgf("failed to process %dB delivery [%v]", len(d.Body), d.DeliveryTag)
		d.Nack(false, false)
	} else {
    log.Debug().Msgf("processed %dB delivery [%v]: ACK", len(d.Body), d.DeliveryTag)
    d.Ack(false)
  }
}

func (r *EndpointResolver) processGenericEgressMsg(d amqp.Delivery) error {
	var (
		err error
	)

  msg := d.Body
  iMsg, err := interaction.NewInteractionMessage(msg)
	if err != nil {
		log.Error().Err(err).Msgf("failed to processGenericEgressMsg: %v", msg)
		return err
	}

	if iMsg.Frame == nil {
		err = fmt.Errorf("iMsg.Frame has not been specified correctly")
		return err
	}

	aasDescriptors, err := getAASDescriptorsFromEndpointRegistry(iMsg.Frame, r.config.EndpointRegistryConfig)
	if err != nil {
		err = fmt.Errorf("queryEndpointRegistry unsuccessful")
		log.Error().Err(err).Msg("queryEndpointRegistry unsuccessful")
		return err
	}

	if len(aasDescriptors) == 0 {
		log.Warn().Msgf("no AAS Descriptor found, dropping message %v", iMsg.Frame.ConversationId)
		return nil
	}

	for _, aasDescriptor := range aasDescriptors {
		descriptor := aasDescriptor.(map[string]interface{})["descriptor"]
		if descriptor == nil {
			jsonDescriptor, err := json.Marshal(aasDescriptor)
			if err != nil {
				log.Error().Err(err).Msgf("could not convert map to JSON: %v", aasDescriptor)
				log.Warn().Msgf("\"descriptor\" key not found in JSON, dropping aasDescriptor %v", aasDescriptor)
			} else {
				log.Warn().Msgf("\"descriptor\" key not found in JSON, dropping aasDescriptor %v", string(jsonDescriptor))
			}
			continue
		}

		endpoints := descriptor.(map[string]interface{})["endpoints"]
		if endpoints == nil {
			jsonDescriptor, err := json.Marshal(aasDescriptor)
			if err != nil {
				log.Error().Err(err).Msgf("could not convert map to JSON: %v", aasDescriptor)
				log.Warn().Msgf("\"endpoints\" key not found in JSON, dropping aasDescriptor %v", aasDescriptor)
			} else {
				log.Warn().Msgf("\"endpoints\" key not found in JSON, dropping aasDescriptor %v", string(jsonDescriptor))
			}
			continue
		}
		for _, endpoint := range endpoints.([]interface{}) {
			jsonEndpoint, err := json.Marshal(endpoint)
			if err != nil {
				log.Error().Err(err).Msgf("resolving for endpoint %v", endpoint)
			} else {
				log.Debug().Msgf("resolving for endpoint %v", string(jsonEndpoint))
			}

			urlHost := fmt.Sprintf("%v", endpoint.(map[string]interface{})["address"])
			rType := fmt.Sprintf("%v", endpoint.(map[string]interface{})["type"])
			target := fmt.Sprintf("%v", endpoint.(map[string]interface{})["target"])
			user := fmt.Sprintf("%v", endpoint.(map[string]interface{})["user"])
			password := fmt.Sprintf("%v", endpoint.(map[string]interface{})["password"])

			tlsCert := fmt.Sprintf("%v", endpoint.(map[string]interface{})["tls_certificate"])
			block, _ := pem.Decode([]byte(tlsCert))
			if block == nil {
				log.Error().Err(err).Msgf("failed to decode PEM string: %q", tlsCert)
				tlsCert = ""
			} else {
				_, err = x509.ParseCertificate(block.Bytes)
				if err != nil {
					log.Error().Err(err).Msgf("failed to parse x509 certificate")
					tlsCert = ""
				}
			}

      resolverMsg := ResolverMsg{
				EgressPayload:    msg,
				ReceiverURL:      urlHost,
				ReceiverType:     rType,
				ReceiverTarget:   target,
				ReceiverTLSCert:  &tlsCert,
				ReceiverUser:     &user,
				ReceiverPassword: &password,
      }

      if iMsg.Frame.Receiver.Identification == nil || iMsg.Frame.Receiver.Identification.Id == "" {
        descriptorIdentification := aasDescriptor.(map[string]interface{})["identification"]
        descriptorIdentificationId := descriptorIdentification.(map[string]interface{})["id"]
        descriptorIdentificationIdType := descriptorIdentification.(map[string]interface{})["idType"]

        jsonDescriptorIdentificationId, err := json.Marshal(descriptorIdentificationId)
        if err != nil {
          log.Error().Err(err).Msgf("resolving for AASDescriptor identification id: %v", descriptorIdentificationId)
        } else {
          log.Debug().Msgf("resolving for AASDescriptor identification id: %v", string(jsonDescriptorIdentificationId))
        }
        jsonDescriptorIdentificationIdType, err := json.Marshal(descriptorIdentificationIdType)
        if err != nil {
          log.Error().Err(err).Msgf("resolving for AASDescriptor identification idType: %v", descriptorIdentificationIdType)
        } else {
          log.Debug().Msgf("resolving for AASDescriptor identification idType: %v", string(jsonDescriptorIdentificationIdType))
        }

        newIMsg, err := interaction.NewInteractionMessage(msg)
        protoReceiver := newIMsg.GetFrame().GetReceiver()
        if protoReceiver.GetIdentification() == nil {
          protoReceiver.Identification = &interaction.Identification{}
        }

        protoReceiver.Identification.Id = string(jsonDescriptorIdentificationId)
        protoReceiver.Identification.IdType = string(jsonDescriptorIdentificationIdType)
        protoReceiver.Identification.Id = strings.Replace(protoReceiver.Identification.Id, "\"", "", -1)
        protoReceiver.Identification.IdType = strings.Replace(protoReceiver.Identification.IdType, "\"", "", -1)

        log.Info().Msgf("old receiver: %v", iMsg.Frame.Receiver)
        log.Info().Msgf("new receiver: %v", newIMsg.Frame.Receiver)

        var dat map[string]interface{}
        if err := json.Unmarshal(msg, &dat); err != nil {
          log.Error().Err(err).Msg("unable to unmarshal msg")
          return err
        }

        msgElements := dat["interactionElements"].([]interface{})
        msgElementsJSON, err := json.Marshal(msgElements)
        if err != nil {
          log.Error().Err(err).Msgf("unable to Marshal interactionElements %v", msgElements)
          return err
        }

        marshaler := jsonpb.Marshaler{}
        frameJSON, err := marshaler.MarshalToString(newIMsg.Frame)
        if err != nil {
          fmt.Printf("%v", fmt.Errorf("%v", err))
          return err
        }

        newMsg := "{\"frame\":" + frameJSON + ",\"interactionElements\":" + string(msgElementsJSON) + "}"

        resolverMsg.EgressPayload = []byte(newMsg)
      }

      payload, err := json.Marshal(resolverMsg)
			if err != nil {
				log.Error().Err(err).Msgf("unable to Marshal resolverMsg %v", resolverMsg)
				return err
      }

			var routingKey string
			if rType == "grpc" {
				routingKey = "egress.grpc"
			} else if rType == "http" || rType == "https" {
				routingKey = "egress.http"
			} else {
				err = fmt.Errorf("unsupported endpoint type %q", rType)
				log.Error().Err(err).Msgf("unsupported endpoint type %q", rType)
				return err
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

func getAASDescriptorsFromEndpointRegistry(frame *interaction.Frame, reg *EndpointRegistryConfig) ([]interface{}, error) {
	var (
		dat          []interface{}
		err          error
		route        string
		q            url.Values
		registryResp []byte
	)

	if frame.Receiver == nil {
		err = fmt.Errorf("(receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified correctly")
		return nil, err
	}

	if frame.Receiver.Identification != nil && frame.Receiver.Identification.Id != "" {
		route = "/AASDescriptors/" + url.QueryEscape(frame.Receiver.Identification.Id)
		q = url.Values{}

		registryResp, err = queryEndpointRegistry(route, q, reg)
		if err != nil {
			return nil, err
		}

		if string(registryResp) == "{}" {
			log.Warn().Msgf("queryEndpointRegistry returned empty: %v, dropping message %v", string(registryResp), frame.ConversationId)
			return dat, nil
		}

		registryResp = []byte("[" + string(registryResp) + "]")
	} else if frame.SemanticProtocol != "" && frame.Receiver.Role != nil && frame.Receiver.Role.Name != "" {
		route = "/semanticProtocols/" + url.QueryEscape(frame.SemanticProtocol) + "/role/" + url.QueryEscape(frame.Receiver.Role.Name) + "/AASDescriptors"
		q = url.Values{}

		registryResp, err = queryEndpointRegistry(route, q, reg)
		if err != nil {
			return nil, err
		}

		if string(registryResp) == "[]" {
			log.Warn().Msgf("queryEndpointRegistry returned empty: %v, dropping message %v", string(registryResp), frame.ConversationId)
			return dat, nil
		}
	} else {
		err = fmt.Errorf("(receiverId && receiverIdType) || (receiverRole && semanticProtocol) has not been specified correctly")
		return nil, err
	}

	if err := json.Unmarshal(registryResp, &dat); err != nil {
		log.Error().Err(err).Msg("unable to unmarshal msg")
		return nil, err
	}

	return dat, nil
}

func queryEndpointRegistry(route string, q url.Values, reg *EndpointRegistryConfig) ([]byte, error) {
	var (
		bodyText []byte
		client   *http.Client
		err      error
	)

	client = &http.Client{}

	registryURL := reg.Protocol + "://" + reg.Host + ":" + strconv.Itoa(reg.Port) + route
	req, err := http.NewRequest("GET", registryURL, nil)
	if err != nil {
		log.Error().Err(err).Msg("failed to create endpoint-registry request")
		return nil, err
	}
	req.SetBasicAuth(reg.User, reg.Password)
	req.Header.Add("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.URL.RawQuery = q.Encode()

	log.Debug().Msgf("querying: %s", req.URL.String())

	resp, err := client.Do(req)
	if err != nil {
		log.Error().Err(err).Msg("failed to query endpoint-registry")
		return nil, err
	}

	if resp.StatusCode >= 300 {
		err = fmt.Errorf("errored with status code %v while querying endpoint-registry", resp.StatusCode)
		log.Error().Err(err).Msg("errored querying endpoint-registry")
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

	if cfg.EndpointRegistryConfig == nil {
		err = fmt.Errorf("EndpointRegistryConfig cannot be nil")
		return err
	}
	err = cfg.EndpointRegistryConfig.validate()
	if err != nil {
		return err
	}

	if cfg.Queue == "" {
		err = fmt.Errorf("Queue cannot be empty string")
		return err
	}
	if cfg.BindingKey == "" {
		err = fmt.Errorf("BindingKey cannot be empty string")
		return err
	}
	if cfg.Ctag == "" {
		err = fmt.Errorf("Ctag cannot be empty string")
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
	if cfg.CrtFilePath == "" && cfg.Protocol == "https" {
		err = fmt.Errorf("path to certificate has not been specified")
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
