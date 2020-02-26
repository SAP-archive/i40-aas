package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"../go/pkg/amqpclient"
	utils "../go/pkg/containerutils"
	"../go/pkg/grpcendpoint"
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

	log.Info().Msg("Graceful shutdown.")
}
