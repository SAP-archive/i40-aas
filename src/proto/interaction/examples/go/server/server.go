package main

import (
	"context"
	"fmt"
	"net"
	"os"

	"github.com/golang/protobuf/jsonpb"
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
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}
}

func (s *interactionServer) SendInteractionMessage(ctx context.Context, im *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
	marshaler := jsonpb.Marshaler{}
	imJSON, err := marshaler.MarshalToString(im)
	if err != nil {
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}
	fmt.Printf("got InteractionMessage: %v\n", imJSON)

	return &interaction.InteractionStatus{
		Code: 200,
	}, nil
}
