package firstgrpc

import (
	"context"
	"log"
	"testing"
)

func TestNewGRPCServer(t *testing.T) {
	srvConfig := GRPCServerConfig{
		Port:        8080,
		Certificate: "",
		Key:         "",
		ChunkSize:   12,
		Compress:    false,
	}

	srv, err := NewGRPCServer(srvConfig)
	if err != nil {
		log.Fatal(err)
	}

	if srv.port != 8080 {
		t.Errorf("Port was specified, but not configured correctly.")
	}
	if srv.key != "" {
		t.Errorf("Key was specified, but not configured correctly.")
	}
}

func TestClose(t *testing.T) {
	srvConfig := GRPCServerConfig{
		Port:        8080,
		Certificate: "",
		Key:         "",
		ChunkSize:   12,
		Compress:    false,
	}

	srv, err := NewGRPCServer(srvConfig)
	if err != nil {
		log.Fatal(err)
	}

	srv.Close(context.Background())
}
