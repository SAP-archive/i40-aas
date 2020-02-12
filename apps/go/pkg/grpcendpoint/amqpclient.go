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
	msgChan  chan []byte
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

	c.msgChan = make(chan []byte)

	return c
}

func (c *amqpClient) init() {
	amqpConn, err := amqp.Dial(fmt.Sprintf("amqp://%s:%s@%s:%s/", c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port)))
	if err != nil {
		log.Fatalf("failed AMQP dial to RabbitMQ: %s", err)
	}
	c.amqpConn = amqpConn

	log.Printf("got Connection, getting Channel")

	amqpChan, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("failed to open Channel: %s", err)
	}
	c.amqpChan = amqpChan

	log.Printf("got Channel, declaring Exchange (%q)", c.config.Exchange)

	amqpChan.ExchangeDeclare(
		c.config.Exchange, // name
		"topic",           //type
		true,              // durable
		false,             // delete when unused
		false,             // exclusive
		false,             // no-wait
		nil,               // arguments
	)

	log.Printf("declared Exchange")

	log.Printf("connected to AMQP Broker at 'amqp://%s:%s@%s:%s/'", c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port))
}

func (c *amqpClient) listen(bindingKey string, ctag string) {
	log.Printf("declaring Queue %q", c.config.Queue)
	queue, err := c.amqpChan.QueueDeclare(
		c.config.Queue, // name of the queue
		true,           // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // noWait
		nil,            // arguments
	)
	if err != nil {
		log.Fatalf("Queue Declare: %s", err)
	}

	log.Printf("declared Queue (%q %d messages, %d consumers), binding to Exchange (key %q)",
		queue.Name, queue.Messages, queue.Consumers, bindingKey)

	if err = c.amqpChan.QueueBind(
		queue.Name,        // name of the queue
		bindingKey,        // bindingKey
		c.config.Exchange, // sourceExchange
		false,             // noWait
		nil,               // arguments
	); err != nil {
		log.Fatalf("Queue Bind: %s", err)
	}

	log.Printf("Queue bound to Exchange, starting Consume (consumer tag %q)", ctag)
	deliveries, err := c.amqpChan.Consume(
		queue.Name, // name
		ctag,       // consumerTag,
		false,      // noAck
		false,      // exclusive
		false,      // noLocal
		true,       // noWait
		nil,        // arguments
	)
	if err != nil {
		log.Fatalf("Queue Consume: %s", err)
	}

	for d := range deliveries {
		log.Printf(
			"got %dB delivery: [%v]",
			len(d.Body),
			d.DeliveryTag,
		)
		c.msgChan <- d.Body
		d.Ack(false)
	}

	log.Printf("deliveries channel closed")
}

func (c *amqpClient) close() {
	if c.amqpChan != nil {
		c.amqpChan.Close()
	}
	if c.amqpConn != nil {
		c.amqpConn.Close()
	}
}

func (c *amqpClient) publish(routingKey string, body string) {
	err := c.amqpChan.Publish(
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
		log.Printf("Publishing message to Exchange %s failed: %s", c.config.Exchange, err)
	}
}
