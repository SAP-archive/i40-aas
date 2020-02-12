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

	"../go/pkg/amenityutils"
	"../go/pkg/grpcendpoint"
)

func main() {
	// Enable line numbers in logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	var (
		AMQPCfg        grpcendpoint.AMQPClientConfig
		EndpointRegCfg grpcendpoint.EndpointRegistryConfig
		GRPCEgressCfg  grpcendpoint.GRPCEgressConfig
		GRPCEgress     grpcendpoint.GRPCEgress
	)

	// amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_AMQP_PORT"))
	amqpPort := 5672
	AMQPCfg = grpcendpoint.AMQPClientConfig{
		Host:     "localhost", //os.Getenv("RABBITMQ_AMQP_HOST"),
		Port:     amqpPort,
		User:     "guest",                //os.Getenv("RABBITMQ_BROKER_USER"),
		Password: "guest",                //os.Getenv("RABBITMQ_BROKER_PASSWORD"),
		Exchange: "amq.topic",            //os.Getenv("RABBITMQ_BROKER_EXCHANGE"),
		Queue:    "grpc-endpoint-egress", //os.Getenv("GRPC_ENDPOINT_EGRESS_BROKER_QUEUE"),
	}

	// registryPort, _ := strconv.Atoi(os.Getenv("ENDPOINT_REGISTRY_PORT"))
	registryPort := 4400
	EndpointRegCfg = grpcendpoint.EndpointRegistryConfig{
		Protocol: "http",      // os.Getenv("ENDPOINT_REGISTRY_PROTOCOL"),
		Host:     "localhost", // os.Getenv("ENDPOINT_REGISTRY_HOST"),
		Port:     registryPort,
		Route:    "/assetadministrationshells", // os.Getenv("ENDPOINT_REGISTRY_URL_SUFFIX"),
		User:     "admin",                      // os.Getenv("ENDPOINT_REGISTRY_ADMIN_USER),
		Password: "admin",                      // os.Getenv("ENDPOINT_REGISTRY_ADMIN_PASSWORD"),
	}

	GRPCEgressCfg = grpcendpoint.GRPCEgressConfig{
		AMQPConfig:  AMQPCfg,
		EndpointReg: EndpointRegCfg,
	}

	services := []string{fmt.Sprintf("%s:%s", AMQPCfg.Host, strconv.Itoa(amqpPort))}
	amenityutils.WaitForServices(services, time.Duration(60)*time.Second)

	GRPCEgress = grpcendpoint.NewGRPCEgress(GRPCEgressCfg)

	GRPCEgress.Init()

	waitForShutdown(GRPCEgress)
}

func waitForShutdown(GRPCEgress grpcendpoint.GRPCEgress) {
	defer os.Exit(0)

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	GRPCEgress.Shutdown(ctx)

	log.Printf("Graceful shutdown.")
}
