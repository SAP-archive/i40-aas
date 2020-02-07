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
		errors.Errorf("ChunkSize must be specified")
	case cfg.ChunkSize > (1 << 22):
		errors.Errorf("ChunkSize must be < than 4MB")
	default:
		c.config.ChunkSize = 8
	}
	return c
}

func (c *grpcClient) init() {
	conn, err := grpc.Dial(c.config.Host+":"+strconv.Itoa(c.config.Port), c.config.GrpcOpts...)
	if err != nil {
		c.conn = conn
	}
	if err != nil {
		err = errors.Wrapf(err,
			"failed to start grpc connection with address %s",
			c.config.Host+":"+strconv.Itoa(c.config.Port))
		return
	}

	c.fileClient = fileservice.NewAASFileServiceClient(c.conn)
	c.interactionClient = interaction.NewInteractionServiceClient(c.conn)
}

func (c *grpcClient) close(ctx context.Context) {
	if c.conn != nil {
		c.conn.Close()
	}
}
