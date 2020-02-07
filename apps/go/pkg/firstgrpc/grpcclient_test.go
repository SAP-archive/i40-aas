package firstgrpc

import (
	"log"
	"testing"
	"time"
)

func launchServer() {
	grpcSrvCfg := GRPCServerConfig{
		Port:        8182,
		Certificate: "",
		Key:         "",
		ChunkSize:   12,
		Compress:    false,
	}

	grpcSrv, _ := NewGRPCServer(grpcSrvCfg)

	go grpcSrv.Listen()
}

func TestNewGRPCClient(t *testing.T) {
	cltConfig := GRPCClientConfig{
		Address:         "localhost:8182",
		ChunkSize:       12,
		RootCertificate: "",
		Compress:        false,
	}

	clt, err := NewGRPCClient(cltConfig)
	if err != nil {
		log.Fatal(err)
	}

	if clt.Conn.GetState().String() != "IDLE" {
		t.Errorf("ClientConn was initiated, but remains %s", clt.Conn.GetState().String())
	}

	go launchServer()

	// Wait till connection has been established and State changes.
	for clt.Conn.GetState().String() == "IDLE" {
		time.Sleep(time.Millisecond * 50)
	}

	if clt.Conn.GetState().String() != "READY" {
		t.Errorf("ClientConn was initiated, but remains %s", clt.Conn.GetState().String())
	}
}
