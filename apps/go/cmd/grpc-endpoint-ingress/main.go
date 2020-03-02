package main

import (
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"../../pkg/amqpclient"
	"../../pkg/grpcendpoint"
)

func main() {
	if os.Getenv("HOME") != "/home/aasuser" {
		err := godotenv.Load(".env")
		if err == nil {
			log.Warn().Msg("***** DEVELOPMENT MODE: Successfully loaded .env file from ./ *****")
		}
	}

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
		AMQPCfg        amqpclient.Config
		GRPCSrvCfg     grpcendpoint.GRPCServerConfig
		GRPCIngressCfg grpcendpoint.GRPCIngressConfig
		GRPCIngress    grpcendpoint.GRPCIngress
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
	GRPCSrvCfg = grpcendpoint.GRPCServerConfig{
		Port: grpcPort,
		Cert: "",
		Key:  "",
	}

	GRPCIngressCfg = grpcendpoint.GRPCIngressConfig{
		AMQPConfig: AMQPCfg,
		GRPCConfig: GRPCSrvCfg,
	}

	GRPCIngress = grpcendpoint.NewGRPCIngress(GRPCIngressCfg)

	GRPCIngress.Init()

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	GRPCIngress.Shutdown()
	os.Exit(0)
}
