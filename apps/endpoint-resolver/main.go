package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"../go/pkg/amqpclient"
	"../go/pkg/containerutils"
	"../go/pkg/endpointresolver"
)

func main() {
	// Configure logging TimeField and line numbers
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.With().Caller().Logger()

	if os.Getenv("LOG_OUTPUT") == "CONSOLE" {
		output := zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}
		output.FormatMessage = func(i interface{}) string {
			return fmt.Sprintf("%s", i)
		}
		output.FormatFieldName = func(i interface{}) string {
			return fmt.Sprintf("%s:", i)
		}
		output.FormatFieldValue = func(i interface{}) string {
			return strings.ToUpper(fmt.Sprintf("%s", i))
		}

		log.Logger = log.Output(output)
	}

	if os.Getenv("LOG_LEVEL") == "DEBUG" {
		log.Debug().Msg("LOG_LEVEL has been set to DEBUG")
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	var (
		endpointRegCfg   endpointresolver.EndpointRegistryConfig
		amqpConsumerCfg  amqpclient.Config
		amqpPublisherCfg amqpclient.Config
		config           endpointresolver.Config
		resolver         endpointresolver.EndpointResolver
	)

	// registryPort, _ := strconv.Atoi(os.Getenv("ENDPOINT_REGISTRY_PORT"))
	registryPort := 4400
	endpointRegCfg = endpointresolver.EndpointRegistryConfig{
		Protocol: "http",      // os.Getenv("ENDPOINT_REGISTRY_PROTOCOL"),
		Host:     "localhost", // os.Getenv("ENDPOINT_REGISTRY_HOST"),
		Port:     registryPort,
		Route:    "/assetadministrationshells", // os.Getenv("ENDPOINT_REGISTRY_URL_SUFFIX"),
		User:     "admin",                      // os.Getenv("ENDPOINT_REGISTRY_ADMIN_USER),
		Password: "admin",                      // os.Getenv("ENDPOINT_REGISTRY_ADMIN_PASSWORD"),
	}

	// amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_PORT"))
	amqpPort := 5672
	amqpConsumerCfg = amqpclient.Config{
		Host:     "localhost", //os.Getenv("RABBITMQ_HOST"),
		Port:     amqpPort,
		User:     "guest",  //os.Getenv("RABBITMQ_EGRESS_USER"),
		Password: "guest",  //os.Getenv("RABBITMQ_EGRESS_PASSWORD"),
		Exchange: "egress", //os.Getenv("RABBITMQ_EGRESS_EXCHANGE"),
	}
	amqpPublisherCfg = amqpclient.Config{
		Host:     "localhost", //os.Getenv("RABBITMQ_HOST"),
		Port:     amqpPort,
		User:     "guest",  //os.Getenv("RABBITMQ_EGRESS_USER"),
		Password: "guest",  //os.Getenv("RABBITMQ_EGRESS_PASSWORD"),
		Exchange: "egress", //os.Getenv("RABBITMQ_EGRESS_EXCHANGE"),
	}

	config = endpointresolver.Config{
		AMQPConsumerConfig:     amqpConsumerCfg,
		AMQPPublisherConfig:    amqpPublisherCfg,
		EndpointRegistryConfig: endpointRegCfg,
	}

	services := []string{fmt.Sprintf("%s:%s", amqpConsumerCfg.Host, strconv.Itoa(amqpPort))}
	containerutils.WaitForServices(services, time.Duration(60)*time.Second)

	resolver = endpointresolver.NewEndpointResolver(config)

	resolver.Init()

	containerutils.WaitForShutdown()

	defer os.Exit(0)
	defer resolver.Shutdown()
}
