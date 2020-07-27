package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/golang/protobuf/jsonpb"

	"github.com/sap/i40-aas/interaction"
	"google.golang.org/grpc"
)

func main() {
	grpcOpts := []grpc.DialOption{}
	grpcOpts = append(grpcOpts, grpc.WithInsecure())

	conn, err := grpc.Dial("127.0.0.1:50051", grpcOpts...)
	if err != nil {
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}

	interactionClient := interaction.NewInteractionIngressClient(conn)

	interactionFile, err := ioutil.ReadFile("examples/sample_interaction.json")
	if err != nil {
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}

	im := &interaction.InteractionMessage{}
	err = jsonpb.UnmarshalString(string(interactionFile), im)
	if err != nil {
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}

	status, err := interactionClient.SendInteractionMessage(context.Background(), im)
	if err != nil {
		fmt.Printf("%v", fmt.Errorf("%v", err))
		os.Exit(1)
	}

	fmt.Printf("got status: %v\n", status)
}
