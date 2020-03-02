package grpcendpoint

import (
	"context"
	"net"
	"strconv"
	"time"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/peer"

	"../interaction"
)

// GRPCServerConfig struct
type GRPCServerConfig struct {
	Port int
	Cert string
	Key  string
}

// grpcServer struct
type grpcServer struct {
	cfg    GRPCServerConfig
	server *grpc.Server
	iQueue chan *interaction.Interaction
}

func newGRPCServer(cfg GRPCServerConfig) (s grpcServer) {
	if cfg.Port == 0 {
		cfg.Port = 8080
		log.Warn().Msgf("GRPC server port not specified, defaulting to %v", cfg.Port)
	}

	s.cfg = cfg

	s.iQueue = make(chan *interaction.Interaction)

	return s
}

func (s *grpcServer) init() (err error) {
	var (
		listener  net.Listener
		grpcOpts  = []grpc.ServerOption{}
		grpcCreds credentials.TransportCredentials
	)

	listener, err = net.Listen("tcp", ":"+strconv.Itoa(s.cfg.Port))
	if err != nil {
		log.Error().Err(err).Msgf("failed to listen on port %d", s.cfg.Port)
	}

	if s.cfg.Cert != "" && s.cfg.Key != "" {
		grpcCreds, err = credentials.NewServerTLSFromFile(
			s.cfg.Cert, s.cfg.Key)
		if err != nil {
			log.Error().Err(err).Msgf("failed to create tls GRPC server using cert %s and key %s", s.cfg.Cert, s.cfg.Key)
		}
		grpcOpts = append(grpcOpts, grpc.Creds(grpcCreds))
	} else {
		log.Warn().Msg("missing cfg.Key - server is insecure")
	}

	s.server = grpc.NewServer(grpcOpts...)

	interaction.RegisterInteractionServiceServer(s.server, s)

	log.Info().Msgf("GRPCServer is serving on port %v", strconv.Itoa(s.cfg.Port))
	err = s.server.Serve(listener)
	if err != nil {
		log.Error().Err(err).Msg("errored listening for grpc connections")
		return
	}
	return
}

func (s *grpcServer) close() {
	if s.server != nil {
		s.server.Stop()
		log.Debug().Msgf("stopped GRPC server at port %s", strconv.Itoa(s.cfg.Port))
	}
}

// ----------------------------------------------------------------------------------------------------------------------------------------

// UploadInteractionMessage capability
func (s *grpcServer) UploadInteractionMessage(ctx context.Context, iMsg *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
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

	log.Debug().Msgf("processing InteractionMessage from %v is complete, InteractionStatus is %v", c.Addr, i.Status)

	return i.Status, nil
}
