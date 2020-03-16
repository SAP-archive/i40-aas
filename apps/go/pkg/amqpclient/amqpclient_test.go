package amqpclient

import (
	"testing"
)

func init() {

}

func TestNewAMQPClient(t *testing.T) {
	// empty config
	cfg := &Config{}
	_, err := NewAMQPClient(cfg)
	if err == nil {
		t.Errorf("failed to catch empty config")
	}

	// port, user, password, exchange missing
	cfg = &Config{
		Host: "localhost",
	}
	_, err = NewAMQPClient(cfg)
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	// user, password, exchange missing
	cfg = &Config{
		Host: "localhost",
		Port: 5672,
	}
	_, err = NewAMQPClient(cfg)
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	// password, exchange missing
	cfg = &Config{
		Host: "localhost",
		Port: 5672,
		User: "guest",
	}
	_, err = NewAMQPClient(cfg)
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	// exchange missing
	cfg = &Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
	}
	_, err = NewAMQPClient(cfg)
	if err == nil {
		t.Errorf("failed to catch incomplete config")
	}

	// positive case with complete config
	cfg = &Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	}
	_, err = NewAMQPClient(cfg)
	if err != nil {
		t.Errorf("failed to catch incomplete config")
	}
}
