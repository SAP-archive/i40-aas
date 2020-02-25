package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"../go/pkg/amqpclient"
	"../go/pkg/endpointresolver"
	"../go/pkg/utils"
)

func main() {
	// Enable line numbers in logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

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

	// amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_AMQP_PORT"))
	amqpPort := 5672
	amqpConsumerCfg = amqpclient.Config{
		Host:     "localhost", //os.Getenv("RABBITMQ_AMQP_HOST"),
		Port:     amqpPort,
		User:     "guest",   //os.Getenv("RABBITMQ_BROKER_USER"),
		Password: "guest",   //os.Getenv("RABBITMQ_BROKER_PASSWORD"),
		Exchange: "egress",  //os.Getenv("RABBITMQ_BROKER_EXCHANGE"),
		Queue:    "generic", //os.Getenv("GRPC_ENDPOINT_EGRESS_BROKER_QUEUE"),
	}
	amqpPublisherCfg = amqpclient.Config{
		Host:     "localhost", //os.Getenv("RABBITMQ_AMQP_HOST"),
		Port:     amqpPort,
		User:     "guest",  //os.Getenv("RABBITMQ_BROKER_USER"),
		Password: "guest",  //os.Getenv("RABBITMQ_BROKER_PASSWORD"),
		Exchange: "egress", //os.Getenv("RABBITMQ_BROKER_EXCHANGE"),
		Queue:    "",       //os.Getenv("GRPC_ENDPOINT_EGRESS_BROKER_QUEUE"),
	}

	config = endpointresolver.Config{
		AMQPConsumerConfig:     amqpConsumerCfg,
		AMQPPublisherConfig:    amqpPublisherCfg,
		EndpointRegistryConfig: endpointRegCfg,
	}

	services := []string{fmt.Sprintf("%s:%s", amqpConsumerCfg.Host, strconv.Itoa(amqpPort))}
	utils.WaitForServices(services, time.Duration(60)*time.Second)

	resolver = endpointresolver.NewEndpointResolver(config)

	resolver.Init()

	waitForShutdown(resolver)
}

func waitForShutdown(resolver endpointresolver.EndpointResolver) {
	defer os.Exit(0)

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	resolver.Shutdown(ctx)

	log.Printf("Graceful shutdown.")
}
