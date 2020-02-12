package grpcendpoint

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strconv"
)

// GRPCEgress struct
type GRPCEgress struct {
	config      GRPCEgressConfig
	grpcClients []grpcClient
	amqpClient  amqpClient
}

// NewGRPCEgress instance
func NewGRPCEgress(cfg GRPCEgressConfig) (egress GRPCEgress) {
	// TODO: Check default/settings in cfg

	egress.config = cfg
	return egress
}

// Init GRPC clients and AMQP client
func (e *GRPCEgress) Init() {
	e.amqpClient = newAMQPClient(e.config.AMQPConfig)

	e.amqpClient.init()
	go e.amqpClient.listen("http.client", "grpc-egress")

	go func() {
		for msg := range e.amqpClient.msgChan {
			// log.Printf("egress received %s", string(msg))
			dat := make(map[string]interface{})
			if err := json.Unmarshal(msg, &dat); err != nil {
				log.Printf("unable to unmarshal msg: %s", err)
			}

			role := dat["frame"].(map[string]interface{})["receiver"].(map[string]interface{})["role"].(map[string]interface{})["name"]
			receiver := "{\"role\":{\"name\":\"" + fmt.Sprintf("%v", role) + "\"}}"
			semanticprotocol := "i40:registry-semanticProtocol/onboarding"
			grpcCfg := obtainGRPCClientConfig(receiver, semanticprotocol, e.config.EndpointReg)

			log.Printf("%v", grpcCfg)
			// TODO:
			// filter result from endpoint registry
			// check whether GRPC client already exists
			// if no: create one with TTL and store in e.grpcClients
			// if yes: retrieve existing client

			// TODO:
			// send msg via GRPC using the client from above
		}
	}()
}

// Shutdown clients + amqp connection
func (e *GRPCEgress) Shutdown(ctx context.Context) {
	for _, c := range e.grpcClients {
		c.close(ctx)
	}
	e.amqpClient.close()
}

func obtainGRPCClientConfig(receiver string, semanticprotocol string, reg EndpointRegistryConfig) GRPCClientConfig {
	queryEndpointRegistry(receiver, semanticprotocol, reg)

	return GRPCClientConfig{}
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

	log.Printf("querying endpoint registry at %s", registryURL)
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}

	bodyText, err := ioutil.ReadAll(resp.Body)
	log.Printf(string(bodyText))

	return bodyText
}

func updateClients() {
	// TODO
}
