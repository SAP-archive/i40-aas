import * as logger from 'winston';
import * as amqp from 'amqplib/callback_api';
import {
  Connection,
  Channel,
  ConsumeMessage,
  Options,
  Message
} from 'amqplib/callback_api';
import { IMessageBrokerClient } from '../messaginginterface/IMessageBrokerClient';
import { Subscription } from '../messaginginterface/Subscription';

class AmqpConnectionDetails {
  connection: Connection | undefined;
  connectionClosed: boolean = true;
  pubChannel: Channel | undefined;
  subscription: Subscription | undefined;
}

//TODO: set proper time gap for connection retries (6s currently).
class AmqpClient implements IMessageBrokerClient {
  private myConn: AmqpConnectionDetails = new AmqpConnectionDetails();
  private listenerQName: string;
  public listenerCounter = 0;
  public retryCounter = 0;
  public successCounter = 0;
  public start: number;
  public static MQTT_EXCHANGE = 'amq.topic';
  public useMqtt = false;
  private destroyed: boolean = false;

  //TODO: make a parameter object
  constructor(
    private ampqUrl: string,
    private brokerExchange: string,
    private brokerUser: string,
    private brokerPass: string,
    private uniqueListenerId: string,
    useMqtt?: boolean,
    private reconnectAfterMilliSecs?: number
  ) {
    this.start = Date.now();
    this.listenerQName = uniqueListenerId + ':submodels:publishRequests';
    logger.debug('AmpqClient created');
    let that = this;
    process.on('SIGINT', function() {
      that.cleanup();
    });
    if (useMqtt !== undefined) {
      this.useMqtt = useMqtt;
    }
  }

  static sleep(millis: number) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }

  //proxy call easily mockable for testing
  connectToBroker(
    url: string | Options.Connect,
    socketOptions: any,
    callback: (err: any, connection: Connection) => void
  ): void {
    amqp.connect(url, socketOptions, callback);
  }

  killConnection(callback?: (err: any) => void) {
    if (this.myConn.connection) this.myConn.connection.close(callback);
  }

  private connect(cb: () => void) {
    let opt = {
      credentials: require('amqplib').credentials.plain(
        this.brokerUser,
        this.brokerPass
      )
    };
    let url = ' amqp://' + this.ampqUrl + '?heartbeat=60';
    logger.debug('Connecting to ' + url);
    var that = this;
    try {
      this.connectToBroker(url, opt, async function(err, conn: Connection) {
        if (err) {
          logger.error('[AMQP] Error:' + err.message);
          logger.info('Waiting to reconnect');
          let timeout: number;
          if (that.reconnectAfterMilliSecs)
            timeout = that.reconnectAfterMilliSecs;
          else timeout = 6000;
          await AmqpClient.sleep(timeout);
          logger.info('reconnecting. Call count:' + that.retryCounter++);
          that.connect(cb);
          return;
        }
        //no error
        logger.info('[AMQP] definitely connected');
        that.myConn.connection = conn;
        that.myConn.connectionClosed = false;
        conn.on('close', async function() {
          if (that.destroyed) return;
          logger.error(
            '[AMQP] connection lost, reconnecting. Time:' +
              (Date.now() - that.start)
          );
          that.myConn.connectionClosed = true;
          that.connectAndDoSubscription(() => {
            that.setupPublishing(() =>
              logger.info(
                'Successfully connected after drop count:' +
                  ++that.successCounter +
                  '. Time:' +
                  (Date.now() - that.start)
              )
            );
          });
        });
        //}
        cb();
      });
    } catch (error) {
      logger.error('Error when trying to connect:' + error.message);
    }
  }

  addSubscriptionData(subscription: Subscription) {
    this.myConn.subscription = subscription;
  }

  private doSubscription(cb?: () => void) {
    if (!this.myConn.subscription) {
      if (cb) cb();
      return;
    }

    if (this.myConn.connectionClosed) {
      logger.error('Cannot subscribe as connection closed');
      return;
    }
    if (!this.myConn.connection) {
      throw new Error(
        'Message listener could not be started due to the connection not being set up'
      );
    }
    var that = this;
    this.myConn.connection.createChannel(function(err, ch: Channel) {
      if (err) {
        logger.error('Error thrown:' + err.message);
        throw err;
      }
      that.myConn.pubChannel = ch;
      //TODO: durable correct?
      ch.assertExchange(that.brokerExchange, 'topic', { durable: true });
      if (that.useMqtt) {
        ch.assertExchange(AmqpClient.MQTT_EXCHANGE, 'topic', { durable: true });
        ch.bindExchange(that.brokerExchange, AmqpClient.MQTT_EXCHANGE, '*');
      }

      ch.assertQueue(that.listenerQName, { exclusive: false }, function(
        error2,
        q
      ) {
        if (error2) {
          logger.error('Error thrown:' + error2.message);
          throw error2;
          //return;
        }

        if (that.myConn.subscription) {
          logger.info(
            'Listener started. Waiting for messages in ' +
              q.queue +
              ' for topic ' +
              that.myConn.subscription.topic +
              '. Call count: ' +
              ++that.listenerCounter
          );
          logger.debug(
            'Binding ' +
              q.queue +
              ' to exchange ' +
              that.brokerExchange +
              ' for topic ' +
              that.myConn.subscription.topic
          );
          ch.bindQueue(
            q.queue,
            that.brokerExchange,
            that.myConn.subscription.topic
          );
        } else {
          logger.error(
            'Attempting to set up a subscription even though none was provided.'
          );
        }
        ch.consume(
          q.queue,
          function(msg: Message | null) {
            if (msg === null) {
              throw Error('Null message received!');
            }
            logger.debug(
              that.uniqueListenerId + ' received message on queue ' + q.queue
            );

            if (that.myConn.subscription) {
              that.myConn.subscription.messageReceiver.receive(
                msg.content.toString()
              );
            } else {
              logger.error(
                'Attempting to set up a subscription even though none was provided.'
              );
            }
          },
          { noAck: true }
        );
        if (cb) cb();
      });
    });
  }

  //==1.connect and 2.subscribe
  private connectAndDoSubscription(cb?: () => void) {
    if (this.myConn.connection == undefined || this.myConn.connectionClosed) {
      this.connect(() => {
        this.doSubscription(cb);
      });
    } else {
      this.doSubscription(cb);
    }
  }

  startListening(cb?: () => void) {
    if (!this.myConn.subscription) {
      if (cb) cb();
    } else {
      this.connectAndDoSubscription(cb);
    }
  }

  setupPublishing(cb?: () => void) {
    let that = this;
    function publishSetup() {
      logger.debug('Called setupPublishing');
      if (!that.myConn.connection) {
        throw new Error(
          'Message publisher could not be started due to the connection not being set up'
        );
      }
      logger.debug('Creating channel');
      that.myConn.connection.createChannel(function(err: any, ch: Channel) {
        if (err) {
          throw new Error(err.message);
        }
        that.myConn.pubChannel = ch;
        logger.debug('Channel ready. Asserting exchange');

        that.myConn.pubChannel.assertExchange(that.brokerExchange, 'topic', {
          durable: true
        });

        logger.debug('Exchange ' + that.brokerExchange + ' set up for topics');

        if (that.useMqtt) {
          that.myConn.pubChannel.assertExchange(
            AmqpClient.MQTT_EXCHANGE,
            'topic',
            {
              durable: true
            }
          );

          that.myConn.pubChannel.bindExchange(
            AmqpClient.MQTT_EXCHANGE, //destination
            that.brokerExchange, //source
            '#',
            {}
          );

          logger.debug(
            'bound exchange. All messages arriving at ' +
              that.brokerExchange +
              ' will be forwarded to ' +
              AmqpClient.MQTT_EXCHANGE
          );
        }

        logger.debug('Calling publish callback');
        if (cb) cb();
      });
    }

    if (that.myConn.connection == undefined || that.myConn.connectionClosed) {
      that.connect(publishSetup);
    } else {
      publishSetup();
    }
  }

  //TODO: messages get lost if the broker goes down, adjust durability? have queue at client side?
  //TODO: it should take an object (not a string) and stringify it here to make testing easier
  //TODO: make sure setupPublish called before, or call it explicitly
  publish(routingKey: string, msg: string) {
    if (this.myConn.connectionClosed) {
      throw new Error('Cannot publish to closed channel');
    }

    if (!this.myConn.pubChannel) {
      throw new Error('No publication channel available');
    }

    this.myConn.pubChannel.publish(
      this.brokerExchange,
      routingKey,
      Buffer.from(msg)
    );
    logger.debug(
      'amqp client sent to exchange ' +
        this.brokerExchange +
        ' with topic ' +
        routingKey +
        " the following message'" +
        msg +
        "'"
    );
  }

  cleanup() {
    logger.debug('Cleaning up');
    this.destroyed = true;
    if (this.myConn.connection && !this.myConn.connectionClosed) {
      this.myConn.connection.close(); //this takes time
      this.myConn.connectionClosed = true;
      logger.debug('Closed connection');
    }
  }
}

export { AmqpClient };
