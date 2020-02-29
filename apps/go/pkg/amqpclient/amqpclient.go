package amqpclient

import (
	"fmt"
	"strconv"
	"time"

	"github.com/jpillora/backoff"
	"github.com/rs/zerolog/log"
	"github.com/streadway/amqp"
)

// Config struct
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	Exchange string
}

// AMQPClient struct
type AMQPClient struct {
	config    Config
	conn      *amqp.Connection
	channel   *amqp.Channel
	MsgChan   chan []byte
	reconnect bool
	backoff   *backoff.Backoff
}

// NewAMQPClient TODO
func NewAMQPClient(cfg Config) *AMQPClient {
	c := AMQPClient{}
	if cfg.Host == "" {
		log.Warn().Msg("AMQP host not specified, defaulting to 'localhost'")
		cfg.Host = "localhost"
	}
	if cfg.Port == 0 {
		log.Warn().Msg("AMQP port not specified, defaulting to 5672")
		cfg.Port = 5672
	}
	if (cfg.User == "" || cfg.Password == "") && !(cfg.User == "" && cfg.Password == "") {
		log.Warn().Msg("AMQP user/password not configured, defaulting to 'guest:guest'")
		cfg.User = "guest"
		cfg.Password = "guest"
	}

	c.config = cfg
	c.reconnect = true

	c.backoff = &backoff.Backoff{
		Min:    100 * time.Millisecond,
		Max:    10 * time.Second,
		Factor: 2,
		Jitter: true,
	}

	c.MsgChan = make(chan []byte)

	c.connect()

	return &c
}

// Init TODO
func (c *AMQPClient) connect() {
	log.Debug().Msgf("connecting to Exchange %q (AMQP Broker at 'amqp://%s:%s@%s:%s/')", c.config.Exchange, c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port))
	conn, err := amqp.Dial(fmt.Sprintf("amqp://%s:%s@%s:%s/", c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port)))
	if err != nil {
		d := c.backoff.Duration()
		log.Error().Err(err).Msgf("failed AMQP dial to RabbitMQ, retrying in %s...", d)
		time.Sleep(d)
		c.connect()
		return
	}
	c.conn = conn

	log.Debug().Msg("got Connection, getting Channel")

	channel, err := conn.Channel()
	if err != nil {
		d := c.backoff.Duration()
		log.Error().Err(err).Msgf("failed to open Channel, retrying in %s...", d)
		time.Sleep(d)
		c.connect()
		return
	}
	c.channel = channel
	log.Debug().Msgf("got Channel, declaring Exchange %q", c.config.Exchange)

	channel.ExchangeDeclare(
		c.config.Exchange, // name
		"topic",           //type
		true,              // durable
		false,             // delete when unused
		false,             // exclusive
		false,             // no-wait
		nil,               // arguments
	)
	log.Debug().Msg("declared Exchange")

	go func() {
		// Wait for the channel to be closed
		err := <-c.conn.NotifyClose(make(chan *amqp.Error))
		if err != nil {
			log.Debug().Msgf("attempting to reconnect")
			c.connect()
		} else {
			log.Debug().Msgf("received final NotifyClose")
		}
	}()

	log.Info().Msgf("connected to Exchange %q (AMQP Broker at 'amqp://%s:%s@%s:%s/')", c.config.Exchange, c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port))
	c.backoff.Reset()
}

// Close TODO
func (c *AMQPClient) Close() {
	c.reconnect = false
	if c.channel != nil {
		log.Debug().Msg("closing AMQP channel")
		c.channel.Close()
	}
	if c.conn != nil {
		log.Debug().Msg("closing AMQP connection")
		c.conn.Close()
	}
	log.Debug().Msg("AMQP client closed")
}

// Listen TODO
func (c *AMQPClient) Listen(queueName string, bindingKey string, ctag string) {
	log.Debug().Msgf("attempting to consume from Queue %q (bindingKey: %q) as %q", queueName, bindingKey, ctag)
	if c.channel == nil {
		log.Debug().Msg("channel is nil, calling connect() first")
		c.connect()
	} else if c.conn.IsClosed() {
		d := c.backoff.Duration()
		log.Error().Msgf("channel is closed, retrying in %s...", d)
		time.Sleep(d)
		c.Listen(queueName, bindingKey, ctag)
		return
	}

	log.Debug().Msgf("declaring Queue %q", queueName)
	queue, err := c.channel.QueueDeclare(
		queueName, // name of the queue
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // noWait
		nil,       // arguments
	)
	if err != nil {
		d := c.backoff.Duration()
		log.Error().Msgf("failed on Queue Declare, retrying in %s...", d)
		time.Sleep(d)
		c.Listen(queueName, bindingKey, ctag)
		return
	}

	log.Debug().Msgf("declared Queue (%q %d messages, %d consumers), binding to Exchange (key %q)", queue.Name, queue.Messages, queue.Consumers, bindingKey)

	if err = c.channel.QueueBind(
		queue.Name,        // name of the queue
		bindingKey,        // bindingKey
		c.config.Exchange, // sourceExchange
		false,             // noWait
		nil,               // arguments
	); err != nil {
		d := c.backoff.Duration()
		log.Error().Msgf("failed on Queue Bind, retrying in %s...", d)
		time.Sleep(d)
		c.Listen(queueName, bindingKey, ctag)
		return
	}

	log.Debug().Msgf("Queue bound to Exchange %q, starting Consume (consumer tag %q)", c.config.Exchange, ctag)
	deliveries, err := c.channel.Consume(
		queue.Name, // name
		ctag,       // consumerTag,
		false,      // noAck
		false,      // exclusive
		false,      // noLocal
		true,       // noWait
		nil,        // arguments
	)
	if err != nil {
		d := c.backoff.Duration()
		log.Error().Msgf("failed to consume from Queue, retrying in %s...", d)
		time.Sleep(d)
		c.Listen(queueName, bindingKey, ctag)
		return
	}

	log.Info().Msgf("consuming from Queue %q (binding: %q) as %q", queueName, bindingKey, ctag)
	c.backoff.Reset()

	for d := range deliveries {
		log.Debug().Msgf("got %dB delivery: [%v]", len(d.Body), d.DeliveryTag)
		c.MsgChan <- d.Body
		d.Ack(false)
	}

	log.Warn().Msg("deliveries channel closed")

	if c.reconnect {
		log.Debug().Msgf("reconnect is %v, attempting to restart consuming from Queue %q (binding: %q) as %q", c.reconnect, queueName, bindingKey, ctag)
		c.Listen(queueName, bindingKey, ctag)
	}
}

// Publish TODO
func (c *AMQPClient) Publish(routingKey string, payload []byte) {
	if c.channel == nil {
		log.Debug().Msg("channel is nil, calling connect() first")
		c.connect()
	} else if c.conn.IsClosed() {
		d := c.backoff.Duration()
		log.Error().Msgf("channel is closed, retrying in %s...", d)
		time.Sleep(d)
		c.Publish(routingKey, payload)
		return
	}

	err := c.channel.Publish(
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
		d := c.backoff.Duration()
		log.Error().Err(err).Msgf("failed to publish %dB to Exchange %s with routingkey %s, retrying in %s...", len(payload), c.config.Exchange, routingKey, d)
		time.Sleep(d)
		c.Publish(routingKey, payload)
	}
	log.Debug().Msgf("published %dB to Exchange %s with routingkey %s", len(payload), c.config.Exchange, routingKey)
	c.backoff.Reset()
}
