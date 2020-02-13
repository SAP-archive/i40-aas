package grpcendpoint

import (
	"context"
	"log"
	"net"
	"strconv"

	fileservice "../../../proto/fileservice"
	interaction "../../../proto/interaction"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// grpcServer struct
type grpcServer struct {
	config        GRPCServerConfig
	server        *grpc.Server
	iMessageQueue chan *interaction.InteractionMessage
}

func newGRPCServer(cfg GRPCServerConfig) (s grpcServer) {
	if cfg.Port == 0 {
		log.Printf("GRPC server port not specified, defaulting to 8000")
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
		log.Fatalf("failed to listen on port %d", s.config.Port)
	}

	if s.config.Certificate != "" && s.config.Key != "" {
		grpcCreds, err = credentials.NewServerTLSFromFile(
			s.config.Certificate, s.config.Key)
		if err != nil {
			log.Fatalf("failed to create tls GRPC server using cert %s and key %s", s.config.Certificate, s.config.Key)
		}

		grpcOpts = append(grpcOpts, grpc.Creds(grpcCreds))
	}

	s.server = grpc.NewServer(grpcOpts...)

	fileservice.RegisterAASFileServiceServer(s.server, s)
	interaction.RegisterInteractionServiceServer(s.server, s)

	log.Printf("GRPCServer is serving on port %v", strconv.Itoa(s.config.Port))
	err = s.server.Serve(listener)
	if err != nil {
		log.Printf("errored listening for grpc connections: %s", err)
		return
	}
	return
}

func (s *grpcServer) close() {
	if s.server != nil {
		s.server.Stop()
	}
}

// ----------------------------------------------------------------------------------------------------------------------------------------

// Upload capability
func (s *grpcServer) Upload(stream fileservice.AASFileService_UploadServer) (err error) {
	// TODO
	return nil
}

// Download capability
func (s *grpcServer) Download(dlreg *fileservice.DownloadRequest, stream fileservice.AASFileService_DownloadServer) (err error) {
	// TODO
	return nil
}

// UploadInteractionMessage capability
func (s *grpcServer) UploadInteractionMessage(ctx context.Context, iMsg *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
	s.iMessageQueue <- iMsg

	// TODO
	// Return proper InteractionStatus
	iStatus := &interaction.InteractionStatus{}
	return iStatus, nil
}

// UploadInteractionMessageStream capability
func (s *grpcServer) UploadInteractionMessageStream(stream interaction.InteractionService_UploadInteractionMessageStreamServer) error {
	// TODO
	return nil
}
