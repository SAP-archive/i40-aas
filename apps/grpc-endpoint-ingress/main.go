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
		GRPCSrvCfg     grpcendpoint.GRPCServerConfig
		GRPCIngressCfg grpcendpoint.GRPCIngressConfig
		GRPCIngress    grpcendpoint.GRPCIngress
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

	// grpcPort, _ := strconv.Atoi(os.Getenv("GRPC_ENDPOINT_INGRESS_PORT"))
	grpcPort := 8384
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

	services := []string{fmt.Sprintf("%s:%s", AMQPCfg.Host, strconv.Itoa(amqpPort))}
	waitForServices(services, time.Duration(60)*time.Second)

	GRPCIngress = grpcendpoint.NewGRPCIngress(GRPCIngressCfg)

	GRPCIngress.Init()

	waitForShutdown(GRPCIngress)
}

func waitForShutdown(ingress grpcendpoint.GRPCIngress) {
	defer os.Exit(0)

	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()
	ingress.Shutdown(ctx)

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
