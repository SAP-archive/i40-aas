package main

import (
	"context"
	"fmt"
	"net"
	"strconv"
	"time"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/peer"

	"github.com/SAP/i40-aas/src/go/pkg/interaction"
)

// GRPCServerConfig struct
type GRPCServerConfig struct {
	Port int
	Cert string
	Key  string
}

// grpcServer struct
type grpcServer struct {
	cfg    *GRPCServerConfig
	server *grpc.Server
	iQueue chan *interaction.Interaction
}

func newGRPCServer(cfg *GRPCServerConfig) (*grpcServer, error) {
	var (
		s   *grpcServer
		err error
	)

	err = cfg.validate()
	if err != nil {
		return nil, err
	}

	s = &grpcServer{}

	s.cfg = cfg
	s.iQueue = make(chan *interaction.Interaction)

	return s, nil
}

func (s *grpcServer) init() error {
	var (
		listener  net.Listener
		grpcOpts  = []grpc.ServerOption{}
		grpcCreds credentials.TransportCredentials
		err       error
	)

	listener, err = net.Listen("tcp", ":"+strconv.Itoa(s.cfg.Port))
	if err != nil {
		log.Error().Err(err).Msgf("failed to listen on port %d", s.cfg.Port)
		return err
	}

	if s.cfg.Cert != "" && s.cfg.Key != "" {
		grpcCreds, err = credentials.NewServerTLSFromFile(
			s.cfg.Cert, s.cfg.Key)
		if err != nil {
			log.Error().Err(err).Msgf("failed to create tls GRPC server using cert %s and key %s", s.cfg.Cert, s.cfg.Key)
			return err
		}
		grpcOpts = append(grpcOpts, grpc.Creds(grpcCreds))
	} else {
		log.Warn().Msg("missing cfg.Key - server is insecure")
	}

	s.server = grpc.NewServer(grpcOpts...)

	interaction.RegisterInteractionIngressServer(s.server, s)

	errChan := make(chan error)

	go func(errChan chan error) {
		log.Info().Msgf("starting GRPCServer on port %v", strconv.Itoa(s.cfg.Port))
		err = s.server.Serve(listener)
		if err != nil {
			log.Error().Err(err).Msg("errored listening for grpc connections")
			errChan <- err
		}
		errChan <- nil
	}(errChan)

	return nil
}

func (s *grpcServer) close() {
	if s.server != nil {
		s.server.Stop()
		log.Debug().Msgf("stopped GRPC server at port %s", strconv.Itoa(s.cfg.Port))
	}
}

// SendInteractionMessage capability
func (s *grpcServer) SendInteractionMessage(ctx context.Context, iMsg *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
	c, _ := peer.FromContext(ctx)
	log.Debug().Msgf("received new InteractionMessage from %v", c.Addr)

	i := &interaction.Interaction{
		Msg:    iMsg,
		Status: nil,
	}
	s.iQueue <- i

	for i.Status == nil {
		time.Sleep(5 * time.Millisecond)
	}

	log.Debug().Msgf("processed InteractionMessage from %v, InteractionStatus is %v", c.Addr, i.Status)

	return i.Status, nil
}

func (cfg *GRPCServerConfig) validate() error {
	var err error

	if cfg.Port == 0 {
		err = fmt.Errorf("port has not been specified")
		return err
	}

	return nil
}
