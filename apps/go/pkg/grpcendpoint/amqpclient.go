package grpcendpoint

import (
	"fmt"
	"log"
	"strconv"

	"github.com/streadway/amqp"
)

type amqpClient struct {
	config   AMQPClientConfig
	amqpConn *amqp.Connection
	amqpChan *amqp.Channel
}

func newAMQPClient(cfg AMQPClientConfig) (c amqpClient) {
	if cfg.Host == "" {
		log.Fatal("AMQP host not specified, defaulting to 'localhost'")
		cfg.Host = "localhost"
	}
	if cfg.Port == 0 {
		log.Printf("AMQP port not specified, defaulting to 5672")
		cfg.Port = 5672
	}
	if (cfg.User == "" || cfg.Password == "") && !(cfg.User == "" && cfg.Password == "") {
		log.Printf("AMQP user/password not configured, defaulting to 'guest:guest'")
		cfg.User = "guest"
		cfg.Password = "guest"
	}

	c.config = cfg

	return c
}

func (c *amqpClient) init() {
	amqpConn, err := amqp.Dial(fmt.Sprintf("amqp://%s:%s@%s:%s/", c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port)))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %s", err)
	}
	c.amqpConn = amqpConn

	amqpChan, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %s", err)
	}
	c.amqpChan = amqpChan

	amqpChan.ExchangeDeclare(
		c.config.Exchange, // name
		"topic",           //type
		true,              // durable
		false,             // delete when unused
		false,             // exclusive
		false,             // no-wait
		nil,               // arguments
	)

	log.Printf("Connected to AMQP Broker at 'amqp://%s:%s@%s:%s/'", c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port))
}

func (c *amqpClient) close() {
	if c.amqpChan != nil {
		c.amqpChan.Close()
	}
	if c.amqpChan != nil {
		c.amqpChan.Close()
	}
}

func (c *amqpClient) publish(routingKey string, body string) (err error) {
	err = c.amqpChan.Publish(
		c.config.Exchange,
		routingKey, // routing key
		false,      // mandatory
		false,      // immediate
		amqp.Publishing{
			Headers:         amqp.Table{},
			ContentType:     "application/json",
			ContentEncoding: "utf8",
			Body:            []byte(body),
			DeliveryMode:    amqp.Transient, // 1=non-persistent, 2=persistent
			Priority:        0,              // 0-9
		})
	if err != nil {
		log.Printf("Publishing message to Exchange %s failed", c.config.Exchange)
	}
	return err
}
