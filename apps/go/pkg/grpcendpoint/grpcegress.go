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
			semanticprotocol := fmt.Sprint(dat["frame"].(map[string]interface{})["semanticProtocol"])
			grpcCfgs := obtainGRPCClientConfigs(receiver, semanticprotocol, e.config.EndpointReg)

			var c grpcClient
			for _, cfg := range grpcCfgs {
				c = obtainGRPCClient(cfg)
			}

			iMsg := constructInteractionMessage(dat)
			log.Print(iMsg)
			c.interactionClient.UploadInteractionMessage(context.Background(), &iMsg)
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

func constructInteractionMessage(dat map[string]interface{}) interaction.InteractionMessage {
	receiver := dat["frame"].(map[string]interface{})["receiver"]
	iReceiverID := &interaction.Identifier{
		Id:     fmt.Sprint(receiver.(map[string]interface{})["identification"].(map[string]interface{})["id"]),
		IdType: fmt.Sprint(receiver.(map[string]interface{})["identification"].(map[string]interface{})["idType"]),
	}
	iReceiverRole := &interaction.Role{
		Name: fmt.Sprint(receiver.(map[string]interface{})["role"].(map[string]interface{})["name"]),
	}
	iReceiver := &interaction.ConversationMember{
		Identifier: iReceiverID,
		Role:       iReceiverRole,
	}

	sender := dat["frame"].(map[string]interface{})["sender"]
	iSenderID := &interaction.Identifier{
		Id:     fmt.Sprint(sender.(map[string]interface{})["identification"].(map[string]interface{})["id"]),
		IdType: fmt.Sprint(sender.(map[string]interface{})["identification"].(map[string]interface{})["idType"]),
	}
	iSenderRole := &interaction.Role{
		Name: fmt.Sprint(sender.(map[string]interface{})["role"].(map[string]interface{})["name"]),
	}
	iSender := &interaction.ConversationMember{
		Identifier: iSenderID,
		Role:       iSenderRole,
	}

	iFrame := &interaction.Frame{
		SemanticProtocol: fmt.Sprint(dat["frame"].(map[string]interface{})["semanticProtocol"]),
		Type:             fmt.Sprint(dat["frame"].(map[string]interface{})["type"]),
		MessageId:        fmt.Sprint(dat["frame"].(map[string]interface{})["messageId"]),
		ReplyBy:          uint32(dat["frame"].(map[string]interface{})["replyBy"].(float64)),
		Receiver:         iReceiver,
		Sender:           iSender,
		ConversationId:   fmt.Sprint(dat["frame"].(map[string]interface{})["conversationId"]),
	}

	interactionElements, err := json.Marshal(dat["interactionElements"])
	if err != nil {
		log.Printf("unable to marshal interactionElements: %s", err)
	}
	return interaction.InteractionMessage{
		Frame:               iFrame,
		InteractionElements: interactionElements,
	}
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

func obtainGRPCClientConfigs(receiver string, semanticprotocol string, reg EndpointRegistryConfig) []GRPCClientConfig {
	registryResp := queryEndpointRegistry(receiver, semanticprotocol, reg)

	var dat []interface{}
	if err := json.Unmarshal(registryResp, &dat); err != nil {
		log.Printf("unable to unmarshal msg: %s", err)
	}

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
