package grpcendpoint

import (
	"context"
	"strconv"

	"github.com/rs/zerolog/log"

	interaction "../../../proto/interaction"
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
	interactionClient interaction.InteractionServiceClient

	// TODO
	// grpc Methods: (interaction)
	// - UploadInteractionMessage(InteractionMessage) returns (InteractionStatus) {}

	// TODO: KeepAlive & Retry
}

func newGRPCClient(cfg GRPCClientConfig) (c grpcClient) {
	if cfg.Host == "" {
		cfg.Host = "localhost"
		log.Warn().Msgf("GRPC server host not specified, defaulting to %q", cfg.Host)
	}
	if cfg.Port == 0 {
		cfg.Port = 8080
		log.Warn().Msgf("GRPC server port not specified, defaulting to %q", cfg.Port)
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
			log.Error().Err(err).Msgf("failed to create grpc tls client via root-cert %s", cfg.RootCertificate)
		}
		c.config.GrpcOpts = append(c.config.GrpcOpts, grpc.WithTransportCredentials(grpcCreds))
	} else {
		c.config.GrpcOpts = append(c.config.GrpcOpts, grpc.WithInsecure())
	}

	switch {
	case cfg.ChunkSize == 0:
		c.config.ChunkSize = 8
		log.Debug().Msgf("ChunkSize cannot be 0, defaulting to %d", c.config.ChunkSize)
	case cfg.ChunkSize > (1 << 22):
		c.config.ChunkSize = 8
		log.Debug().Msgf("ChunkSize cannot be > (1 << 22), defaulting to %d", c.config.ChunkSize)
	default:
		log.Debug().Msgf("ChunkSize is set to %d", c.config.ChunkSize)
	}
	return c
}

func (c *grpcClient) init() {
	grpcHost := c.config.Host + ":" + strconv.Itoa(c.config.Port)
	conn, err := grpc.Dial(grpcHost, c.config.GrpcOpts...)
	if err != nil {
		log.Error().Err(err).Msgf("failed to start grpc connection with address %s", grpcHost)
	}
	c.conn = conn

	c.interactionClient = interaction.NewInteractionServiceClient(c.conn)

	log.Info().Msgf("GRPC connection to %s initiated and in state %s", grpcHost, c.conn.GetState().String())
}

func (c *grpcClient) close(ctx context.Context) {
	if c.conn != nil {
		c.conn.Close()
	}
}
