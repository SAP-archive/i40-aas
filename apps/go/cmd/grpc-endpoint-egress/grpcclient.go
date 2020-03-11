package main

import (
	"context"
	"fmt"
	"time"

	"github.com/jpillora/backoff"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	"github.com/SAP/i40-aas/src/go/pkg/interaction"
)

// GRPCClientConfig struct
type GRPCClientConfig struct {
	URL      string
	RootCert string
}

// grpcClient struct
type grpcClient struct {
	cfg               *GRPCClientConfig
	conn              *grpc.ClientConn
	interactionClient interaction.InteractionIngressClient

	// TODO
	// - KeepAlive & Retry
}

func newGRPCClient(cfg *GRPCClientConfig) (*grpcClient, error) {
	var (
		c        *grpcClient
		grpcOpts []grpc.DialOption
		err      error
	)

	err = cfg.validate()
	if err != nil {
		return nil, err
	}

	c = &grpcClient{}

	c.cfg = cfg
	grpcOpts = []grpc.DialOption{}

	if cfg.RootCert != "" {
		grpcCreds, err := credentials.NewClientTLSFromFile(cfg.RootCert, "localhost")
		if err != nil {
			log.Error().Err(err).Msgf("failed to create grpc tls client via root-cert %s", cfg.RootCert)
		}
		grpcOpts = append(grpcOpts, grpc.WithTransportCredentials(grpcCreds))
	} else {
		log.Warn().Msg("missing cfg.RootCert - reverting to WithInsecure()")
		grpcOpts = append(grpcOpts, grpc.WithInsecure())
	}

	conn, err := grpc.Dial(c.cfg.URL, grpcOpts...)
	if err != nil {
		log.Error().Err(err).Msgf("failed to start grpc connection with address %s", c.cfg.URL)
		return nil, err
	}
	c.conn = conn

	c.interactionClient = interaction.NewInteractionIngressClient(c.conn)

	log.Info().Msgf("new gRPC client connection to %s initiated and in state %s", c.cfg.URL, c.conn.GetState().String())

	return c, nil
}

func (c *grpcClient) close() error {
	var err error

	if c.conn != nil {
		err = c.conn.Close()
		if err != nil {
			return err
		}

		log.Debug().Msgf("closed connection to %s", c.conn.Target())
	}
	return nil
}

func (c *grpcClient) SendInteractionMessage(iMsg *interaction.InteractionMessage, b *backoff.Backoff) {
	status, err := c.interactionClient.SendInteractionMessage(context.Background(), iMsg)
	if err != nil {
		d := b.Duration()
		log.Error().Err(err).Msgf("failed to SendInteractionMessage, gRPC connection is in state %s, retrying in %s...", c.conn.GetState().String(), d)
		time.Sleep(d)
		c.SendInteractionMessage(iMsg, b)
	} else {
		log.Debug().Msgf("sent InteractionMessage to %s returning status %s", c.cfg.URL, status.String())
	}
}

func (cfg *GRPCClientConfig) validate() error {
	var err error

	if cfg.URL == "" {
		err = fmt.Errorf("URL has not been specified")
		return err
	}

	return nil
}
