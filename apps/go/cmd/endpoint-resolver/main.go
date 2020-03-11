package main

import (
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"

	"github.com/SAP/i40-aas/src/go/pkg/amqpclient"
	"github.com/SAP/i40-aas/src/go/pkg/logging"
)

func main() {
	var err error

	output := os.Getenv("LOG_OUTPUT")
	if output == "" {
		output = "CONSOLE"
	}
	level := os.Getenv("LOG_LEVEL")
	if level == "" {
		level = "DEBUG"
	}
	log.Logger, err = logging.SetupLogging(output, level)
	if err != nil {
		log.Error().Err(err).Msg("failed to configure global logger")
	}

	if os.Getenv("HOME") != "/home/aasuser" {
		err := godotenv.Load(".env")
		if err == nil {
			log.Warn().Msg("***** DEVELOPMENT MODE: Successfully loaded .env file from ./ *****")
		}
	}

	var (
		endpointRegCfg *EndpointRegistryConfig
		amqpCfg        *amqpclient.Config
		config         *Config
		resolver       *EndpointResolver
	)

	registryPort, _ := strconv.Atoi(os.Getenv("ENDPOINT_REGISTRY_PORT"))
	endpointRegCfg = &EndpointRegistryConfig{
		Protocol: os.Getenv("ENDPOINT_REGISTRY_PROTOCOL"),
		Host:     os.Getenv("ENDPOINT_REGISTRY_HOST"),
		Port:     registryPort,
		Route:    os.Getenv("ENDPOINT_REGISTRY_URL_SUFFIX"),
		User:     os.Getenv("ENDPOINT_REGISTRY_ADMIN_USER"),
		Password: os.Getenv("ENDPOINT_REGISTRY_ADMIN_PASSWORD"),
	}

	amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_PORT"))
	amqpCfg = &amqpclient.Config{
		Host:     os.Getenv("RABBITMQ_HOST"),
		Port:     amqpPort,
		User:     os.Getenv("RABBITMQ_EGRESS_USER"),
		Password: os.Getenv("RABBITMQ_EGRESS_PASSWORD"),
		Exchange: os.Getenv("RABBITMQ_EGRESS_EXCHANGE"),
	}

	config = &Config{
		AMQPConfig:             amqpCfg,
		EndpointRegistryConfig: endpointRegCfg,
	}

	resolver, err = NewEndpointResolver(config)
	if err != nil {
		log.Error().Err(err).Msgf("failed to construct new EndpointResolver")
		os.Exit(1)
	}

	err = resolver.Init()
	if err != nil {
		log.Error().Err(err).Msgf("failed to initialize EndpointResolver")
		os.Exit(1)
	}

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	err = resolver.Shutdown()
	if err != nil {
		log.Error().Err(err).Msgf("unable to shut down gracefully")
		os.Exit(1)
	}
	log.Debug().Msg("shut down gracefully")
	os.Exit(0)
}
