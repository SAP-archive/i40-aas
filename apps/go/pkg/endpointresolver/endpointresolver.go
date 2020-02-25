package endpointresolver

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	amqpclient "../amqpclient"
	utils "../utils"
)

// ResolverMsg struct
type ResolverMsg struct {
	EgressPayload []byte
	Host          string
	Port          int
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
	AMQPConsumerConfig     amqpclient.Config
	AMQPPublisherConfig    amqpclient.Config
	EndpointRegistryConfig EndpointRegistryConfig
}

// EndpointResolver struct
type EndpointResolver struct {
	config        Config
	amqpConsumer  amqpclient.AMQPClient
	ampqPublisher amqpclient.AMQPClient
}

// NewEndpointResolver instance
func NewEndpointResolver(cfg Config) (resolver EndpointResolver) {
	// TODO: Check default/settings in cfg
	resolver.config = cfg

	return resolver
}

// Init EndpointResolver and AMQP client
func (r *EndpointResolver) Init() {
	r.amqpConsumer = amqpclient.NewAMQPClient(r.config.AMQPConsumerConfig)
	r.amqpConsumer.Init()
	bindingKey := r.config.AMQPConsumerConfig.Exchange + "." + r.config.AMQPConsumerConfig.Queue
	ctag := "endpoint-resolver"
	go r.amqpConsumer.Listen(bindingKey, ctag)

	r.ampqPublisher = amqpclient.NewAMQPClient(r.config.AMQPPublisherConfig)
	r.ampqPublisher.Init()

	go func() {
		for msg := range r.amqpConsumer.MsgChan {
			r.processGenericEgressMsg(msg)
		}
	}()
}

// Shutdown EndpointResolver
func (r *EndpointResolver) Shutdown(ctx context.Context) {
	r.amqpConsumer.Close()
	r.ampqPublisher.Close()
}

func (r *EndpointResolver) processGenericEgressMsg(msg []byte) {
	iMsg := utils.ConvertRawJSONToInteractionMessage(msg)

	role := iMsg.Frame.Receiver.Role.Name
	receiver := "{\"role\":{\"name\":\"" + fmt.Sprintf("%v", role) + "\"}}"
	semanticprotocol := iMsg.Frame.SemanticProtocol

	registryResp := queryEndpointRegistry(receiver, semanticprotocol, r.config.EndpointRegistryConfig)
	var dat []interface{}
	if err := json.Unmarshal(registryResp, &dat); err != nil {
		log.Printf("unable to unmarshal msg: %s", err)
	}

	// loop over all AAS
	for _, aas := range dat {
		for _, endpoint := range aas.(map[string]interface{})["endpoints"].([]interface{}) {
			if endpoint.(map[string]interface{})["protocol"] == "grpc" {
				if true {
					// TODO Rework - this will 100% error eventually
					urlHost := fmt.Sprintf("%v", endpoint.(map[string]interface{})["url"])
					host := strings.Split(urlHost, ":")[0]
					port, _ := strconv.Atoi(strings.Split(urlHost, ":")[1])

					resolverMsg := ResolverMsg{
						EgressPayload: msg,
						Host:          host,
						Port:          port,
						ReceiverType:  "cloud",
					}
					payload, err := json.Marshal(resolverMsg)
					if err != nil {
						log.Printf("unable to Marshal resolverMsg: %s", err)
					}

					routingKey := "egress.grpc"
					r.ampqPublisher.Publish(routingKey, payload)
				}
			} else if endpoint.(map[string]interface{})["protocol"] == "http" {

			} else {

			}
		}
	}
}

func queryEndpointRegistry(receiver string, semanticprotocol string, reg EndpointRegistryConfig) []byte {
	client := &http.Client{}

	registryURL := reg.Protocol + "://" + reg.Host + ":" + strconv.Itoa(reg.Port) + reg.Route

	req, err := http.NewRequest("GET", registryURL, nil)
	if err != nil {
		log.Fatal(err)
	}
	req.SetBasicAuth(reg.User, reg.Password)
	req.Header.Add("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")

	q := url.Values{}
	q.Add("receiver", receiver)
	q.Add("semanticprotocol", semanticprotocol)
	req.URL.RawQuery = q.Encode()

	// log.Printf("querying endpoint registry at %s", registryURL)
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}

	bodyText, err := ioutil.ReadAll(resp.Body)

	return bodyText
}
