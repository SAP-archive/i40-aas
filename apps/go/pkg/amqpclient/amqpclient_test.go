package amqpclient

import (
	"testing"
)

func init() {
	// fakeServer := server.NewServer("localhost:5432")
	// fakeServer.Start()
	// defer fakeServer.Stop()
}

func TestNewAMQPClient(t *testing.T) {
	cfg := Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "dummyExchange",
	}

	c := NewAMQPClient(cfg)

	c.Connect()

	if c.conn == nil {
		t.Errorf("AMQP connection has not been initialized")
	}
}
