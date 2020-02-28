package amqpclient

import (
	"testing"

	"github.com/NeowayLabs/wabbit/amqptest/server"
)

func init() {
	fakeServer := server.NewServer("localhost:15243")
	fakeServer.Start()
	defer fakeServer.Stop()
}

func TestNewAMQPClient(t *testing.T) {
	cfg := Config{
		Host:     "localhost",
		Port:     15243,
		User:     "guest",
		Password: "guest",
		Exchange: "dummyEx",
	}

	c := NewAMQPClient(cfg)

	c.connect()

	if c.conn == nil {
		t.Errorf("AMQP connection has not been initialized")
	}
}
