package grpcendpoint

import (
	"context"
	"strconv"
	"time"

	"github.com/jpillora/backoff"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"../interaction"
)

// GRPCClientConfig struct
type GRPCClientConfig struct {
	Host     string
	Port     int
	RootCert string
}

// grpcClient struct
type grpcClient struct {
	cfg               GRPCClientConfig
	grpcOpts          []grpc.DialOption
	conn              *grpc.ClientConn
	interactionClient interaction.InteractionServiceClient

	// TODO
	// - KeepAlive & Retry
}

func newGRPCClient(cfg GRPCClientConfig) *grpcClient {
	c := &grpcClient{}

	if cfg.Host == "" {
		cfg.Host = "localhost"
		log.Warn().Msgf("GRPC server host not specified, defaulting to %q", cfg.Host)
	}
	if cfg.Port == 0 {
		cfg.Port = 8080
		log.Warn().Msgf("GRPC server port not specified, defaulting to %q", cfg.Port)
	}

	c.cfg = cfg
	c.grpcOpts = []grpc.DialOption{}

	if cfg.RootCert != "" {
		grpcCreds, err := credentials.NewClientTLSFromFile(cfg.RootCert, "localhost")
		if err != nil {
			log.Error().Err(err).Msgf("failed to create grpc tls client via root-cert %s", cfg.RootCert)
		}
		c.grpcOpts = append(c.grpcOpts, grpc.WithTransportCredentials(grpcCreds))
	} else {
		log.Warn().Msg("missing cfg.RootCert - reverting to WithInsecure()")
		c.grpcOpts = append(c.grpcOpts, grpc.WithInsecure())
	}

	grpcHost := c.cfg.Host + ":" + strconv.Itoa(c.cfg.Port)

	conn, err := grpc.Dial(grpcHost, c.grpcOpts...)
	if err != nil {
		log.Error().Err(err).Msgf("failed to start grpc connection with address %s", grpcHost)
	}
	c.conn = conn

	c.interactionClient = interaction.NewInteractionServiceClient(c.conn)

	log.Info().Msgf("new gRPC client connection to %s initiated and in state %s", grpcHost, c.conn.GetState().String())

	return c
}

func (c *grpcClient) close() {
	if c.conn != nil {
		c.conn.Close()
		log.Debug().Msgf("closed connection to %s", c.conn.Target())
	}
}

func (c *grpcClient) UploadInteractionMessage(iMsg *interaction.InteractionMessage, b *backoff.Backoff) {
	status, err := c.interactionClient.UploadInteractionMessage(context.Background(), iMsg)
	if err != nil {
		d := b.Duration()
		log.Error().Err(err).Msgf("failed to UploadInteractionMessage, gRPC connection is in state %s, retrying in %s...", c.conn.GetState().String(), d)
		time.Sleep(d)
		c.UploadInteractionMessage(iMsg, b)
	} else {
		log.Debug().Msgf("UploadInteractionMessage to %s:%d returned status %s", c.cfg.Host, c.cfg.Port, status.String())
	}
}
