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
	log.Logger = logging.SetupLogging()
	if os.Getenv("HOME") != "/home/aasuser" {
		err := godotenv.Load(".env")
		if err == nil {
			log.Warn().Msg("***** DEVELOPMENT MODE: Successfully loaded .env file from ./ *****")
		}
	}

	var (
		AMQPCfg        amqpclient.Config
		GRPCSrvCfg     GRPCServerConfig
		GRPCIngressCfg GRPCIngressConfig
		GRPCIngress    GRPCIngress
	)

	amqpPort, _ := strconv.Atoi(os.Getenv("RABBITMQ_PORT"))
	AMQPCfg = amqpclient.Config{
		Host:     os.Getenv("RABBITMQ_HOST"),
		Port:     amqpPort,
		User:     os.Getenv("RABBITMQ_INGRESS_USER"),
		Password: os.Getenv("RABBITMQ_INGRESS_PASSWORD"),
		Exchange: os.Getenv("RABBITMQ_INGRESS_EXCHANGE"),
	}

	grpcPort, _ := strconv.Atoi(os.Getenv("GRPC_ENDPOINT_INGRESS_PORT"))
	GRPCSrvCfg = GRPCServerConfig{
		Port: grpcPort,
		Cert: "",
		Key:  "",
	}

	GRPCIngressCfg = GRPCIngressConfig{
		AMQPConfig: AMQPCfg,
		GRPCConfig: GRPCSrvCfg,
	}

	GRPCIngress = NewGRPCIngress(GRPCIngressCfg)

	GRPCIngress.Init()

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	GRPCIngress.Shutdown()
	os.Exit(0)
}
