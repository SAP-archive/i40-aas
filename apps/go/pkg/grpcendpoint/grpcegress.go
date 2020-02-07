package grpcendpoint

import "context"

// GRPCEgress struct
type GRPCEgress struct {
	config      GRPCEgressConfig
	grpcClients []grpcClient
	amqpClient  amqpClient

	// TODO
	// <-chan handler AMQP -> GRPC
}

// NewGRPCEgress instance
func NewGRPCEgress(cfg GRPCEgressConfig) (egress GRPCEgress) {
	// TODO: Check default/settings in cfg

	egress.config = cfg
	return egress
}

// Init GRPC clients and AMQP client
func (e *GRPCEgress) Init() {
	e.amqpClient = newAMQPClient(e.config.AMQPConfig)

	go e.amqpClient.init()
}

// Shutdown clients + amqp connection
func (e *GRPCEgress) Shutdown(ctx context.Context) {
	// TODO close all clients
	for _, c := range e.grpcClients {
		c.close(ctx)
	}
	e.amqpClient.close()
}

func queryEndpointRegistry() {
	// TODO
}

func updateClients() {
	// TODO
}
