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
		Queue:    "dummyQ",
	}

	c := NewAMQPClient(cfg)

	if c.amqpConn != nil {
		t.Errorf("AMQP connection has not yet been initialized")
	}

	c.Init()

	if c.amqpConn != nil {
		t.Errorf("AMQP connection has not yet been initialized")
	}
}
