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
	config    *Config
	conn      *amqp.Connection
	channel   *amqp.Channel
	reconnect bool
	backoff   *backoff.Backoff
}

// NewAMQPClient for a given Config
func NewAMQPClient(cfg *Config) (*AMQPClient, error) {
	var (
		c   *AMQPClient
		err error
	)

	err = cfg.validate()
	if err != nil {
		return nil, err
	}

	c = &AMQPClient{}
	c.config = cfg
	c.reconnect = true

	c.backoff = &backoff.Backoff{
		Min:    50 * time.Millisecond,
		Max:    10 * time.Second,
		Factor: 2,
		Jitter: true,
	}

	return c, nil
}

// Connect TODO
func (c *AMQPClient) Connect() error {
	var err error

	log.Debug().Msgf("connecting to Exchange %q (AMQP Broker at 'amqp://%s:%s@%s:%s/')", c.config.Exchange, c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port))
	conn, err := amqp.Dial(fmt.Sprintf("amqp://%s:%s@%s:%s/", c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port)))
	if err != nil {
		d := c.backoff.Duration()
		log.Error().Err(err).Msgf("failed AMQP dial to RabbitMQ, retrying in %s...", d)
		time.Sleep(d)
		err = c.Connect()
		return err
	}
	c.conn = conn

	log.Debug().Msg("got Connection, getting Channel")

	channel, err := conn.Channel()
	if err != nil {
		d := c.backoff.Duration()
		log.Error().Err(err).Msgf("failed to open Channel, retrying in %s...", d)
		time.Sleep(d)
		err = c.Connect()
		return err
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
		errChan := <-c.conn.NotifyClose(make(chan *amqp.Error))
		if errChan != nil {
			log.Debug().Msgf("attempting to reconnect")
			err = c.Connect()
			return
		}
		log.Debug().Msgf("received final NotifyClose")
	}()

	log.Info().Msgf("connected to Exchange %q (AMQP Broker at 'amqp://%s:%s@%s:%s/')", c.config.Exchange, c.config.User, c.config.Password, c.config.Host, strconv.Itoa(c.config.Port))
	c.backoff.Reset()

	return nil
}

// Close TODO
func (c *AMQPClient) Close() error {
	var err error

	c.reconnect = false

	if c.channel != nil {
		err = c.channel.Close()
		if err != nil {
			return err
		}
		log.Debug().Msg("closed AMQP channel")
	}

	if c.conn != nil {
		err = c.conn.Close()
		if err != nil {
			return err
		}
		log.Debug().Msg("closed AMQP connection")
	}

	log.Debug().Msg("closed AMQPClient")
	return nil
}

// Listen TODO
func (c *AMQPClient) Listen(queueName string, bindingKey string, ctag string) <-chan amqp.Delivery {
	deliveries := make(<-chan amqp.Delivery)

	log.Debug().Msgf("attempting to consume from Queue %q (bindingKey: %q) as %q", queueName, bindingKey, ctag)
	if c.channel == nil {
		log.Debug().Msg("channel is nil, calling Connect() first")
		c.Connect()
	} else if c.conn.IsClosed() {
		d := c.backoff.Duration()
		log.Error().Msgf("channel is closed, retrying in %s...", d)
		time.Sleep(d)
		deliveries = c.Listen(queueName, bindingKey, ctag)
		return deliveries
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
		deliveries = c.Listen(queueName, bindingKey, ctag)
		return deliveries
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
		deliveries = c.Listen(queueName, bindingKey, ctag)
		return deliveries
	}

	log.Debug().Msgf("Queue bound to Exchange %q, starting Consume (consumer tag %q)", c.config.Exchange, ctag)
	deliveries, err = c.channel.Consume(
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
		deliveries = c.Listen(queueName, bindingKey, ctag)
		return deliveries
	}

	log.Info().Msgf("consuming from Queue %q (binding: %q) as %q", queueName, bindingKey, ctag)
	c.backoff.Reset()

	return deliveries
}

// Publish TODO
func (c *AMQPClient) Publish(routingKey string, payload []byte) error {
	if c.channel == nil {
		log.Debug().Msg("channel is nil, calling connect() first")
		c.Connect()
	} else if c.conn.IsClosed() {
		d := c.backoff.Duration()
		log.Error().Msgf("channel is closed, retrying in %s...", d)
		time.Sleep(d)
		status := c.Publish(routingKey, payload)
		return status
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
		log.Error().Err(err).Msgf("failed to publish %dB to Exchange %q with routingkey %q, retrying in %s...", len(payload), c.config.Exchange, routingKey, d)
		time.Sleep(d)
		status := c.Publish(routingKey, payload)
		return status
	}
	log.Debug().Msgf("published %dB to Exchange %q with routingkey %q", len(payload), c.config.Exchange, routingKey)
	c.backoff.Reset()
	return nil
}

// validate a Config for an AMQPClient by checking that everything has been set
func (cfg *Config) validate() error {
	var err error

	if cfg.Host == "" {
		err = fmt.Errorf("host has not been specified")
		return err
	}
	if cfg.Port == 0 {
		err = fmt.Errorf("port has not been specified")
		return err
	}
	if cfg.User == "" {
		err = fmt.Errorf("user has not been specified")
		return err
	}
	if cfg.Password == "" {
		err = fmt.Errorf("password has not been specified")
		return err
	}
	if cfg.Exchange == "" {
		err = fmt.Errorf("exchange has not been specified")
		return err
	}
	return nil
}
