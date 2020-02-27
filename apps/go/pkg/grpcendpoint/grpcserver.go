package grpcendpoint

import (
	"context"
	"net"
	"strconv"

	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/peer"

	interaction "../interaction"
)

// GRPCServerConfig struct
type GRPCServerConfig struct {
	Port        int
	Certificate string
	Key         string
	ChunkSize   int
	Compress    bool
}

// grpcServer struct
type grpcServer struct {
	config        GRPCServerConfig
	server        *grpc.Server
	iMessageQueue chan *interaction.InteractionMessage
}

func newGRPCServer(cfg GRPCServerConfig) (s grpcServer) {
	if cfg.Port == 0 {
		cfg.Port = 8080
		log.Warn().Msgf("GRPC server port not specified, defaulting to %v", cfg.Port)
	}

	s.config = cfg

	s.iMessageQueue = make(chan *interaction.InteractionMessage)

	return s
}

func (s *grpcServer) init() (err error) {
	var (
		listener  net.Listener
		grpcOpts  = []grpc.ServerOption{}
		grpcCreds credentials.TransportCredentials
	)

	listener, err = net.Listen("tcp", "localhost:"+strconv.Itoa(s.config.Port))
	if err != nil {
		log.Error().Err(err).Msgf("failed to listen on port %d", s.config.Port)
	}

	if s.config.Certificate != "" && s.config.Key != "" {
		grpcCreds, err = credentials.NewServerTLSFromFile(
			s.config.Certificate, s.config.Key)
		if err != nil {
			log.Error().Err(err).Msgf("failed to create tls GRPC server using cert %s and key %s", s.config.Certificate, s.config.Key)
		}

		grpcOpts = append(grpcOpts, grpc.Creds(grpcCreds))
	}

	// TODO: Keepalive options

	s.server = grpc.NewServer(grpcOpts...)

	interaction.RegisterInteractionServiceServer(s.server, s)

	log.Info().Msgf("GRPCServer is serving on port %v", strconv.Itoa(s.config.Port))
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
		log.Debug().Msgf("stopped GRPC server at port %s", strconv.Itoa(s.config.Port))
	}
}

// ----------------------------------------------------------------------------------------------------------------------------------------

// UploadInteractionMessage capability
func (s *grpcServer) UploadInteractionMessage(ctx context.Context, iMsg *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
	c, _ := peer.FromContext(ctx)
	log.Debug().Msgf("received new InteractionMessage from %v", c.Addr)

	// TODO check whether InteractionMessage is complete and adjust Status accordingly
	go func() { s.iMessageQueue <- iMsg }()

	iStatus := &interaction.InteractionStatus{
		Code: 1,
	}

	return iStatus, nil
}
