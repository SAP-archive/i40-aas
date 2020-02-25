package amqpclient

import (
	"fmt"
	"log"
	"strconv"

	"github.com/streadway/amqp"
)

// Config struct
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	Exchange string
	Queue    string
}

// AMQPClient struct
type AMQPClient struct {
	config   Config
	amqpConn *amqp.Connection
	amqpChan *amqp.Channel
	MsgChan  chan []byte
}

// NewAMQPClient TODO
func NewAMQPClient(cfg Config) (c AMQPClient) {
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

	c.MsgChan = make(chan []byte)

	return c
}

// Init TODO
func (c *AMQPClient) Init() {
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

// Listen TODO
func (c *AMQPClient) Listen(bindingKey string, ctag string) {
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
		// log.Printf(
		// 	"got %dB delivery: [%v]",
		// 	len(d.Body),
		// 	d.DeliveryTag,
		// )
		c.MsgChan <- d.Body
		d.Ack(false)
	}

	log.Printf("deliveries channel closed")
}

// Close TODO
func (c *AMQPClient) Close() {
	if c.amqpChan != nil {
		c.amqpChan.Close()
	}
	if c.amqpConn != nil {
		c.amqpConn.Close()
	}
}

// Publish TODO
func (c *AMQPClient) Publish(routingKey string, payload []byte) {
	err := c.amqpChan.Publish(
		c.config.Exchange,
		routingKey, // routing key
		false,      // mandatory
		false,      // immediate
		amqp.Publishing{
			Headers:         amqp.Table{},
			ContentType:     "application/json",
			ContentEncoding: "utf8",
			Body:            payload,
			DeliveryMode:    amqp.Transient, // 1=non-persistent, 2=persistent
			Priority:        0,              // 0-9
		})
	if err != nil {
		log.Printf("Publishing message with key %s to Exchange %s failed: %s", routingKey, c.config.Exchange, err)
	}
	// log.Printf("Published %dB with key %s to Exchange %s", len(payload), routingKey, c.config.Exchange)
}
