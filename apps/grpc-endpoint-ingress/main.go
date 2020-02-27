package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"../go/pkg/amqpclient"
	"../go/pkg/containerutils"
	"../go/pkg/grpcendpoint"
)

func main() {
	err := godotenv.Load("../../.env")
	if err == nil {
		log.Warn().Msg("Successfully loaded .env file from repository root!")
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
		Port:        grpcPort,
		Certificate: "",
		Key:         "",
		ChunkSize:   8,
		Compress:    true,
	}

	GRPCIngressCfg = grpcendpoint.GRPCIngressConfig{
		AMQPConfig: AMQPCfg,
		GRPCConfig: GRPCSrvCfg,
	}

	// services := []string{fmt.Sprintf("%s:%s", AMQPCfg.Host, strconv.Itoa(amqpPort))}
	// utils.WaitForServices(services, time.Duration(60)*time.Second)

	GRPCIngress = grpcendpoint.NewGRPCIngress(GRPCIngressCfg)

	GRPCIngress.Init()

	containerutils.WaitForShutdown()

	defer os.Exit(0)
	defer GRPCIngress.Shutdown()
}
