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

	output := os.Getenv("LOGGING_LOGOUTPUT")
	if output == "" {
		output = "CONSOLE"
	}
	level := os.Getenv("LOGGING_LOGLEVEL")
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
		amqpCfg    *amqpclient.Config
		grpcSrvCfg *GRPCServerConfig
		ingressCfg *GRPCIngressConfig
		ingress    *GRPCIngress
	)

	amqpPort, err := strconv.Atoi(os.Getenv("CORE_BROKER_PORT"))
	if err != nil {
		log.Error().Err(err).Msg("failed to read and cast CORE_BROKER_PORT")
	}
	amqpCfg = &amqpclient.Config{
		Host:     os.Getenv("CORE_BROKER_HOST"),
		Port:     amqpPort,
		User:     os.Getenv("CORE_INGRESS_USER"),
		Password: os.Getenv("CORE_INGRESS_PASSWORD"),
		Exchange: os.Getenv("CORE_INGRESS_EXCHANGE"),
	}

	grpcPort, err := strconv.Atoi(os.Getenv("CORE_INGRESS_GRPC_PORT"))
	if err != nil {
		log.Error().Err(err).Msg("failed to read and cast CORE_INGRESS_GRPC_PORT")
	}
	grpcSrvCfg = &GRPCServerConfig{
		Port: grpcPort,
		Cert: "",
		Key:  "",
	}

	ingressCfg = &GRPCIngressConfig{
		AMQPConfig:    amqpCfg,
		GRPCSrvConfig: grpcSrvCfg,
	}

	ingress, err = NewGRPCIngress(ingressCfg)
	if err != nil {
		log.Error().Err(err).Msgf("failed to construct new GRPCIngress")
		os.Exit(1)
	}

	err = ingress.Init()
	if err != nil {
		log.Error().Err(err).Msgf("failed to initialize GRPCIngress")
		os.Exit(1)
	}

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	err = ingress.Shutdown()
	if err != nil {
		log.Error().Err(err).Msgf("unable to shut down gracefully")
		os.Exit(1)
	}
	log.Debug().Msg("shut down gracefully")
	os.Exit(0)
}
