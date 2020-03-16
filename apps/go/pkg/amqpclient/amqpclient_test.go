package amqpclient

import (
	"strconv"
	"testing"
	"time"

	"github.com/rs/zerolog/log"
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

// TODO: this only tests a positive flow thus boosting coverage. The actually more important
// (error) cases still require testing. Since refactoring of this package is already being
// considered, this is postponed for now.
func TestE2EFlow(t *testing.T) {
	var (
		c   *AMQPClient
		err error
	)

	c, err = NewAMQPClient(&Config{
		Host:     "localhost",
		Port:     5672,
		User:     "guest",
		Password: "guest",
		Exchange: "test",
	})
	if err != nil {
		t.Errorf("failed to create AMQPClient for tests")
	}
	err = c.Connect()
	if err != nil {
		t.Errorf("failed to connect to broker")
	}

	timestamp := strconv.Itoa(int(time.Now().Unix()))

	deliveries := c.Listen("dummy-"+timestamp, "test.dummy-"+timestamp, "testclient")

	dummyPayload := []byte("{\"foo\":\"bar\"}")
	err = c.Publish("test.dummy-"+timestamp, dummyPayload)
	if err != nil {
		t.Errorf("failed to publish message to broker")
	}

	d := <-deliveries
	log.Debug().Msgf("got new delivery [%v]: %v", string(d.Body), d.DeliveryTag)

	err = c.Close()
	if err != nil {
		t.Errorf("failed to close client")
	}
}
