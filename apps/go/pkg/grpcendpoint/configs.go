package grpcendpoint

import "google.golang.org/grpc"

// EndpointRegistryConfig struct
type EndpointRegistryConfig struct {
	Protocol string
	Host     string
	Port     int
	Route    string
	User     string
	Password string
}

// GRPCEgressConfig struct
type GRPCEgressConfig struct {
	AMQPConfig  AMQPClientConfig
	EndpointReg EndpointRegistryConfig
}

// GRPCIngressConfig struct
type GRPCIngressConfig struct {
	AMQPConfig AMQPClientConfig
	GRPCConfig GRPCServerConfig
}

// GRPCServerConfig struct
type GRPCServerConfig struct {
	Port        int
	Certificate string
	Key         string
	ChunkSize   int
	Compress    bool
}

// GRPCClientConfig struct
type GRPCClientConfig struct {
	Host            string
	Port            int
	RootCertificate string
	ChunkSize       int
	Compress        bool
	GrpcOpts        []grpc.DialOption
}

// AMQPClientConfig struct
type AMQPClientConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Exchange string
}
