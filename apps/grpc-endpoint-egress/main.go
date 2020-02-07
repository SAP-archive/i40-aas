package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"

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
		User:     "guest",     //os.Getenv("RABBITMQ_BROKER_USER"),
		Password: "guest",     //os.Getenv("RABBITMQ_BROKER_PASSWORD"),
		Exchange: "amq.topic", //os.Getenv("RABBITMQ_BROKER_EXCHANGE"),
	}

	// registryPort, _ := strconv.Atoi(os.Getenv("ENDPOINT_REGISTRY_PORT"))
	registryPort := 4400
	EndpointRegCfg = grpcendpoint.EndpointRegistryConfig{
		Protocol: "http",      // os.Getenv("ENDPOINT_REGISTRY_PROTOCOL"),
		Host:     "localhost", // os.Getenv("ENDPOINT_REGISTRY_HOST"),
		Port:     registryPort,
		Route:    "/endpoints", // os.Getenv("ENDPOINT_REGISTRY_URL_SUFFIX"),
		User:     "admin",      // os.Getenv("ENDPOINT_REGISTRY_ADMIN_USER),
		Password: "admin",      // os.Getenv("ENDPOINT_REGISTRY_ADMIN_PASSWORD"),
	}

	GRPCEgressCfg = grpcendpoint.GRPCEgressConfig{
		AMQPConfig:  AMQPCfg,
		EndpointReg: EndpointRegCfg,
	}

	services := []string{fmt.Sprintf("%s:%s", AMQPCfg.Host, strconv.Itoa(amqpPort))}
	waitForServices(services, time.Duration(60)*time.Second)

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

// ref.: https://github.com/alioygur/wait-for/blob/master/main.go
// waitForServices tests and waits on the availability of a TCP host and port
func waitForServices(services []string, timeOut time.Duration) error {
	var depChan = make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(len(services))
	go func() {
		for _, s := range services {
			go func(s string) {
				defer wg.Done()
				for {
					_, err := net.Dial("tcp", s)
					if err == nil {
						return
					}
					time.Sleep(1 * time.Second)
				}
			}(s)
		}
		wg.Wait()
		close(depChan)
	}()

	select {
	case <-depChan: // services are ready
		return nil
	case <-time.After(timeOut):
		return fmt.Errorf("services aren't ready in %s", timeOut)
	}
}
