package grpcendpoint

import (
	"context"
	"log"
	"strconv"

	fileservice "../../../proto/fileservice"
	interaction "../../../proto/interaction"
	"github.com/pkg/errors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// GRPCClientConfig struct
type GRPCClientConfig struct {
	Host            string
	Port            int
	RootCertificate string
	ChunkSize       int
	Compress        bool
	GrpcOpts        []grpc.DialOption
}

// grpcClient struct
type grpcClient struct {
	config            GRPCClientConfig
	conn              *grpc.ClientConn
	fileClient        fileservice.AASFileServiceClient
	interactionClient interaction.InteractionServiceClient

	// TODO
	// grpc Methods: (interaction)
	// - UploadInteractionMessageStream(stream InteractionMessage) returns (InteractionStatus) {}
	// - UploadInteractionMessage(InteractionMessage) returns (InteractionStatus) {}

	// TODO: KeepAlive & Retry
}

func newGRPCClient(cfg GRPCClientConfig) (c grpcClient) {
	if cfg.Host == "" {
		log.Fatal("GRPC server host not specified, defaulting to 'localhost'")
	}
	if cfg.Port == 0 {
		log.Printf("GRPC server port not specified, defaulting to 8000")
	}

	c.config = cfg
	c.config.GrpcOpts = []grpc.DialOption{}

	if cfg.Compress {
		c.config.GrpcOpts = append(c.config.GrpcOpts,
			grpc.WithDefaultCallOptions(grpc.UseCompressor("gzip")))
	}

	if cfg.RootCertificate != "" {
		grpcCreds, err := credentials.NewClientTLSFromFile(cfg.RootCertificate, "localhost")
		if err != nil {
			err = errors.Wrapf(err,
				"failed to create grpc tls client via root-cert %s",
				cfg.RootCertificate)
			return
		}

		c.config.GrpcOpts = append(c.config.GrpcOpts, grpc.WithTransportCredentials(grpcCreds))
	} else {
		c.config.GrpcOpts = append(c.config.GrpcOpts, grpc.WithInsecure())
	}

	switch {
	case cfg.ChunkSize == 0:
		c.config.ChunkSize = 8
		log.Printf("ChunkSize cannot be 0, defaulting to %d", c.config.ChunkSize)
	case cfg.ChunkSize > (1 << 22):
		c.config.ChunkSize = 8
		log.Printf("ChunkSize cannot be > (1 << 22), defaulting to %d", c.config.ChunkSize)
	default:
		log.Printf("ChunkSize is set to %d", c.config.ChunkSize)
	}
	return c
}

func (c *grpcClient) init() {
	grpcHost := c.config.Host + ":" + strconv.Itoa(c.config.Port)
	conn, err := grpc.Dial(grpcHost, c.config.GrpcOpts...)
	if err != nil {
		log.Printf("failed to start grpc connection with address %s", grpcHost)
	}
	c.conn = conn

	c.fileClient = fileservice.NewAASFileServiceClient(c.conn)
	c.interactionClient = interaction.NewInteractionServiceClient(c.conn)

	log.Printf("GRPC connection to %s initiated and in state %s", grpcHost, c.conn.GetState().String())
}

func (c *grpcClient) close(ctx context.Context) {
	if c.conn != nil {
		c.conn.Close()
	}
}
