package main

import (
	"fmt"
	"io/ioutil"
	"net/url"
	"os"
	"strconv"
	"testing"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
	"github.com/SAP/i40-aas/src/go/pkg/interaction"
	"github.com/streadway/amqp"
)

func TestNewEndpointResolver(t *testing.T) {
	var (
		amqpCfg     *amqpclient.Config
		registryCfg *EndpointRegistryConfig
		cfg         *Config
		err         error
	)

	amqpCfg = &amqpclient.Config{
		Host:     "localhost",
		Port:     0,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "localhost",
		Port:     0,
		User:     "admin",
		Password: "admin",
	}

	cfg = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: registryCfg,
		Queue:                  "generic",
		BindingKey:             "egress.generic",
		Ctag:                   "endpoint-resolver",
	}

	// negative case with incomplete AMQPConfig
	_, err = NewEndpointResolver(cfg)
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	amqpCfg.Port = 5672

	// negative case with incomplete EndpointRegistryConfig
	_, err = NewEndpointResolver(cfg)
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.Port = 4400

	// positive case with complete config
	cfg = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: registryCfg,
		Queue:                  "generic",
		BindingKey:             "egress.generic",
		Ctag:                   "endpoint-resolver",
	}

	_, err = NewEndpointResolver(cfg)
	if err != nil {
		t.Errorf("failed to validate complete config")
	}
}

func TestInit(t *testing.T) {
	var (
		amqpCfg     *amqpclient.Config
		registryCfg *EndpointRegistryConfig
		cfg         *Config
		resolver    *EndpointResolver
		err         error
	)

	amqpCfg = &amqpclient.Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "localhost",
		Port:     4400,
		User:     "admin",
		Password: "admin",
	}

	cfg = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: registryCfg,
		Queue:                  "generic",
		BindingKey:             "egress.generic",
		Ctag:                   "endpoint-resolver",
	}

	resolver, err = NewEndpointResolver(cfg)
	if err != nil {
		t.Errorf("failed to construct EndpointResolver")
	}

	err = resolver.Init()
	if err != nil {
		t.Errorf("failed to initialize EndpointResolver")
	}
}

func TestProcessDeliver(t *testing.T) {
	var (
		amqpCfg     *amqpclient.Config
		registryCfg *EndpointRegistryConfig
		cfg         *Config
		resolver    *EndpointResolver
		err         error
	)

	amqpCfg = &amqpclient.Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "localhost",
		Port:     4400,
		User:     "admin",
		Password: "admin",
	}

	cfg = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: registryCfg,
		Queue:                  "generic",
		BindingKey:             "egress.generic",
		Ctag:                   "endpoint-resolver",
	}

	resolver, err = NewEndpointResolver(cfg)
	if err != nil {
		t.Errorf("failed to construct EndpointResolver")
	}

	err = resolver.Init()
	if err != nil {
		t.Errorf("failed to initialize EndpointResolver")
	}

	jsonFile, err := os.Open("samplejson.json")
	if err != nil {
		t.Errorf("failed to open samplejson.json")
	}
	defer jsonFile.Close()
	payload, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		t.Errorf("failed to read samplejson.json")
	}

	d := amqp.Delivery{
		Body: payload,
	}

	resolver.processDelivery(d)
}

func TestShutdown(t *testing.T) {
	var (
		amqpCfg     *amqpclient.Config
		registryCfg *EndpointRegistryConfig
		cfg         *Config
		resolver    *EndpointResolver
		err         error
	)

	amqpCfg = &amqpclient.Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "localhost",
		Port:     4400,
		User:     "admin",
		Password: "admin",
	}

	cfg = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: registryCfg,
		Queue:                  "generic",
		BindingKey:             "egress.generic",
		Ctag:                   "endpoint-resolver",
	}

	resolver, err = NewEndpointResolver(cfg)
	if err != nil {
		t.Errorf("failed to construct EndpointResolver")
	}

	err = resolver.Shutdown()
}

func TestQueryEndpointRegistry(t *testing.T) {
	var (
		registryCfg *EndpointRegistryConfig
		err         error
	)

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "myhost",
		Port:     4400,
		User:     "admin",
		Password: "admin",
	}

	_, err = queryEndpointRegistry("/faulty", url.Values{}, registryCfg)
	if err == nil {
		t.Errorf("failed to catch faulty host")
	}

	registryCfg.Host = "localhost"

	_, err = queryEndpointRegistry("/faulty", url.Values{}, registryCfg)
	if err == nil {
		t.Errorf("failed to catch faulty route")
	}

	_, err = queryEndpointRegistry("/semanticProtocols/i40%3Aregistry-semanticProtocol%2Fonboarding/role/Operator/AASDescriptors", url.Values{}, registryCfg)
	if err != nil {
		t.Errorf("failed to query endpoint registry")
	}
}

func TestGetAASDescriptorsFromEndpointRegistry(t *testing.T) {
	var (
		registryCfg *EndpointRegistryConfig
		frame       *interaction.Frame
		err         error
	)

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "myhost",
		Port:     4400,
		User:     "admin",
		Password: "admin",
	}

	iReceiverID := &interaction.Identification{
		Id:     "www.sampleOperator/aas",
		IdType: "IRI",
	}
	iReceiverRole := &interaction.Role{
		Name: "Operator",
	}
	iReceiver := &interaction.ConversationMember{
		Identification: iReceiverID,
		Role:           iReceiverRole,
	}
	iSenderID := &interaction.Identification{
		Id:     "www.sampleOperator/aas",
		IdType: "IRI",
	}
	iSenderRole := &interaction.Role{
		Name: "Operator",
	}
	iSender := &interaction.ConversationMember{
		Identification: iSenderID,
		Role:           iSenderRole,
	}
	frame = &interaction.Frame{
		SemanticProtocol: "i40:registry-semanticProtocol/onboarding",
		Type:             "publishInstance",
		MessageId:        "Sample_Msg_ID_001",
		ReplyBy:          99999999,
		Receiver:         iReceiver,
		Sender:           iSender,
		ConversationId:   "123",
	}

	_, err = getAASDescriptorsFromEndpointRegistry(frame, registryCfg)
	if err == nil {
		t.Errorf("")
	}
}

func TestProcessGenericEgressMsg(t *testing.T) {
	var (
		amqpCfg     *amqpclient.Config
		registryCfg *EndpointRegistryConfig
		cfg         *Config
		resolver    *EndpointResolver
		err         error
	)

	amqpCfg = &amqpclient.Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "localhost",
		Port:     4400,
		User:     "admin",
		Password: "admin",
	}

	cfg = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: registryCfg,
		Queue:                  "generic",
		BindingKey:             "egress.generic",
		Ctag:                   "endpoint-resolver",
	}

	resolver, err = NewEndpointResolver(cfg)
	if err != nil {
		t.Errorf("failed to construct EndpointResolver")
	}

	jsonFile, err := os.Open("samplejson.json")
	if err != nil {
		t.Errorf("failed to open samplejson.json")
	}
	defer jsonFile.Close()
	payload, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		t.Errorf("failed to read samplejson.json")
	}

	d := amqp.Delivery{
		Body: payload,
	}

	err = resolver.processGenericEgressMsg(d)
	if err != nil {
		t.Errorf("failed to send test message to broker")
	}
}

func TestValidateConfig(t *testing.T) {
	var (
		amqpCfg     *amqpclient.Config
		registryCfg *EndpointRegistryConfig
		cfg         *Config
		err         error
	)

	cfg = &Config{
		AMQPConfig:             nil,
		EndpointRegistryConfig: nil,
		Queue:                  "",
		BindingKey:             "",
		Ctag:                   "",
	}

	amqpCfg = &amqpclient.Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}

	registryCfg = &EndpointRegistryConfig{
		Protocol: "http",
		Host:     "localhost",
		Port:     0,
		User:     "admin",
		Password: "admin",
	}

	// negative case with incomplete config
	err = cfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	cfg.AMQPConfig = amqpCfg

	// negative case with incomplete config
	err = cfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	cfg.EndpointRegistryConfig = registryCfg

	// negative case with incomplete config
	err = cfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.Port = 4400

	// negative case with incomplete config
	err = cfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	cfg.Queue = "generic"

	// negative case with incomplete config
	err = cfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	cfg.BindingKey = "egress.generic"

	// negative case with incomplete config
	err = cfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	cfg.Ctag = "endpoint-resolver"

	// positive case with complete config
	err = cfg.validate()
	if err != nil {
		t.Errorf("failed to catch incomplete config")
	}
}

func TestValidateEndpointRegistryConfig(t *testing.T) {
	var (
		registryCfg *EndpointRegistryConfig
		err         error
	)

	registryCfg = &EndpointRegistryConfig{
		Protocol: "",
		Host:     "",
		Port:     0,
		User:     "",
		Password: "",
	}

	err = registryCfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.Protocol = "http"

	// negative case with incomplete config
	err = registryCfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.Host = "localhost"

	// negative case with incomplete config
	err = registryCfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.Port = 4400

	// negative case with incomplete config
	err = registryCfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.User = "admin"

	// negative case with incomplete config
	err = registryCfg.validate()
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	registryCfg.Password = "admin"

	// positive case with complete config
	err = registryCfg.validate()
	if err != nil {
		t.Errorf("failed to validate complete config")
	}
}

func sendTestMessageToBroker() error {
	var (
		Host     string
		Port     int
		User     string
		Password string
		Exchange string
		Queue    string
		err      error
	)

	Host = "localhost"
	Port = 5672
	User = "guest"
	Password = "guest"
	Exchange = "egress"
	Queue = "egress.generic"

	amqpConn, err := amqp.Dial(fmt.Sprintf("amqp://%s:%s@%s:%s/", User, Password, Host, strconv.Itoa(Port)))
	if err != nil {
		fmt.Printf("failed AMQP dial to RabbitMQ: %s", err)
		return err
	}

	amqpChan, err := amqpConn.Channel()
	if err != nil {
		fmt.Printf("failed to open Channel: %s", err)
		return err
	}

	amqpChan.ExchangeDeclare(
		Exchange, // name
		"topic",  //type
		true,     // durable
		false,    // delete when unused
		false,    // exclusive
		false,    // no-wait
		nil,      // arguments
	)

	jsonFile, err := os.Open("samplejson.json")
	if err != nil {
		fmt.Println(err)
		return err
	}
	defer jsonFile.Close()
	payload, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		fmt.Println(err)
		return err
	}

	err = amqpChan.Publish(
		Exchange,
		Queue, // routing key
		false, // mandatory
		false, // immediate
		amqp.Publishing{
			Headers:         amqp.Table{},
			ContentType:     "application/json",
			ContentEncoding: "utf8",
			Body:            payload,
			DeliveryMode:    amqp.Transient, // 1=non-persistent, 2=persistent
			Priority:        0,              // 0-9
		})

	if err != nil {
		fmt.Println(err)
		return err
	}

	err = amqpChan.Close()
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}
