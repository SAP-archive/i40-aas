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
	"strings"

	interaction "../../../proto/interaction"
	"github.com/golang/protobuf/jsonpb"
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
			iMsg := convertRawJSONToInteractionMessage(msg)

			role := iMsg.Frame.Receiver.Role.Name
			receiver := "{\"role\":{\"name\":\"" + fmt.Sprintf("%v", role) + "\"}}"
			semanticprotocol := iMsg.Frame.SemanticProtocol

			registryResp := queryEndpointRegistry(receiver, semanticprotocol, e.config.EndpointReg)
			grpcCfgs := grpcClientConfigsFromRegistryResponse(registryResp)

			for _, cfg := range grpcCfgs {
				var c grpcClient
				c = obtainGRPCClient(cfg)
				c.interactionClient.UploadInteractionMessage(context.Background(), iMsg)
				// TODO:
				// Remove once client maps is implemented correctly
				c.close(context.Background())
			}
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

func convertRawJSONToInteractionMessage(jsonRaw []byte) *interaction.InteractionMessage {
	dat := make(map[string]interface{})
	if err := json.Unmarshal(jsonRaw, &dat); err != nil {
		log.Printf("unable to Unmarshal jsonRaw: %s", err)
	}

	jsonFrameRaw, err := json.Marshal(dat["frame"])
	if err != nil {
		log.Printf("unable to Marshal dat[\"frame\"]: %s", err)
	}

	jsonFrame := string(jsonFrameRaw)

	protoFrame := &interaction.Frame{}
	jsonpb.UnmarshalString(jsonFrame, protoFrame)

	interactionElementsRaw, err := json.Marshal(dat["interactionElements"])
	if err != nil {
		log.Printf("unable to Marshal dat[\"interactionElements\"]: %s", err)
	}

	protoMessage := &interaction.InteractionMessage{
		Frame:               protoFrame,
		InteractionElements: interactionElementsRaw,
	}

	return protoMessage
}

func obtainGRPCClient(cfg GRPCClientConfig) grpcClient {
	// TODO:
	// filter result from endpoint registry
	// check whether GRPC client already exists
	// if no: create one with TTL and store in e.grpcClients
	// if yes: retrieve existing client
	var c grpcClient

	if false {
		// TODO
		// Check whether matching GRPC connection is already open
	} else {
		// TODO
		// Store GRPC connection in corresponding map within egress
		c = newGRPCClient(cfg)
		c.init()
	}

	return c
}

func grpcClientConfigsFromRegistryResponse(registryResp []byte) []GRPCClientConfig {

	var dat []interface{}
	if err := json.Unmarshal(registryResp, &dat); err != nil {
		log.Printf("unable to unmarshal msg: %s", err)
	}

	log.Printf("dat: %T : %v", dat, dat)

	clientConfigs := []GRPCClientConfig{}
	// loop over all AAS
	for _, aas := range dat {
		for _, endpoint := range aas.(map[string]interface{})["endpoints"].([]interface{}) {
			if endpoint.(map[string]interface{})["protocol"] == "grpc" {
				grpcHost := fmt.Sprintf("%v", endpoint.(map[string]interface{})["url"])
				host := strings.Split(grpcHost, ":")[0]
				port, _ := strconv.Atoi(strings.Split(grpcHost, ":")[1])

				clientConfigs = append(clientConfigs, GRPCClientConfig{
					Host: host,
					Port: port,
				})
			}
		}
	}

	return clientConfigs
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

	return bodyText
}
