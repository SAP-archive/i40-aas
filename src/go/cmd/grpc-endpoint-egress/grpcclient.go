package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
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
	URL        string
	TLSEnabled bool
	Cert       string
}

// grpcClient struct
type grpcClient struct {
	cfg               *GRPCClientConfig
	conn              *grpc.ClientConn
	interactionClient interaction.InteractionIngressClient
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

	if cfg.TLSEnabled {
		// Ref. for self-signed cert security issues & workarounds
		// https://forfuncsake.github.io/post/2017/08/trust-extra-ca-cert-in-go-app/

		// Get the SystemCertPool, continue with an empty pool on error
		rootCAs, err := x509.SystemCertPool()
		if err != nil {
			log.Error().Err(err).Msgf("failed to read system rootCAs")
			return nil, err
		}
		if rootCAs == nil {
			rootCAs = x509.NewCertPool()
		}

		// Append our cert to the system pool
		if ok := rootCAs.AppendCertsFromPEM([]byte(cfg.Cert)); !ok {
			log.Warn().Msgf("No certs appended, using system certs only")
		}

		// Trust the augmented cert pool in our client
		tlsCfg := &tls.Config{
			RootCAs: rootCAs,
		}

		grpcCreds := credentials.NewTLS(tlsCfg)
		grpcOpts = append(grpcOpts, grpc.WithTransportCredentials(grpcCreds))
	} else {
		log.Warn().Msg("TLS disabled - reverting to WithInsecure()")
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
