package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"os"

	"github.com/sap/i40-aas/interaction"
	"google.golang.org/grpc"
)

type interactionServer struct {
	server *grpc.Server
	interaction.UnimplementedInteractionIngressServer
}

func main() {
	s := &interactionServer{}

	grpcOpts := []grpc.ServerOption{}
	s.server = grpc.NewServer(grpcOpts...)

	interaction.RegisterInteractionIngressServer(s.server, s)

	listener, err := net.Listen("tcp", "localhost:50051")
	if err != nil {
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}
	err = s.server.Serve(listener)
	if err != nil {
		log.Printf("errored listening for grpc connections: %s", err)
		return
	}
}

func (s *interactionServer) SendInteractionMessage(ctx context.Context, im *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
	fmt.Printf("got InteractionMessage: %v\n", im)

	return &interaction.InteractionStatus{
		Code: 200,
	}, nil
}
