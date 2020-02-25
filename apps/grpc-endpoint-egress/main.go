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
	"../go/pkg/grpcendpoint"
	"../go/pkg/utils"
)

func main() {
	// Enable line numbers in logging
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	var (
		AMQPCfg       amqpclient.Config
		GRPCEgressCfg grpcendpoint.GRPCEgressConfig
		GRPCEgress    grpcendpoint.GRPCEgress
	)

	// amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_AMQP_PORT"))
	amqpPort := 5672
	AMQPCfg = amqpclient.Config{
		Host:     "localhost", //os.Getenv("RABBITMQ_AMQP_HOST"),
		Port:     amqpPort,
		User:     "guest",  //os.Getenv("RABBITMQ_BROKER_USER"),
		Password: "guest",  //os.Getenv("RABBITMQ_BROKER_PASSWORD"),
		Exchange: "egress", //os.Getenv("RABBITMQ_BROKER_EXCHANGE"),
		Queue:    "grpc",   //os.Getenv("GRPC_ENDPOINT_EGRESS_BROKER_QUEUE"),
	}

	GRPCEgressCfg = grpcendpoint.GRPCEgressConfig{
		AMQPConfig: AMQPCfg,
	}

	services := []string{fmt.Sprintf("%s:%s", AMQPCfg.Host, strconv.Itoa(amqpPort))}
	utils.WaitForServices(services, time.Duration(60)*time.Second)

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
