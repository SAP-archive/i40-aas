import * as logger from "winston";
import * as amqp from "amqplib/callback_api";
import {
  Connection,
  Channel,
  ConsumeMessage,
  Options,
  Message
} from "amqplib/callback_api";
import { IMessageBrokerClient } from "./IBrokerClient";

class AmqpConnectionDetails {
  connection: Connection | undefined;
  connectionClosed: boolean = true;
  pubChannel: Channel | undefined;
  //consumerTag: string | undefined;
}

//TODO: check if keeping variables and functions static is a good idea
//TODO: set proper time gap for connection retries (6s currently).
//TODO: not to use static methods
class AmqpClient implements IMessageBrokerClient {
  isConnected(): boolean {
    return this.myConn.connectionClosed ? false : true;
  }
  private myConn: AmqpConnectionDetails = new AmqpConnectionDetails();
  public listenerCounter = 0;
  public retryCounter = 0;
  public successCounter = 0;
  public start: number;
  public static MQTT_EXCHANGE = "amq.topic";
  public useMqtt = false;
  private destroyed: boolean = false;
  private  ampqUrl:string;

  //private subscription: Subscription | undefined;

  constructor(
    private brokerHost: string,
    private brokerPort: string,
        private brokerExchange: string,
    private brokerUser: string,
    private brokerPass: string,
    private reconnectAfterMilliSecs?: number
  ) {
    this.ampqUrl = "amqp://"+brokerHost+":"+brokerPort ,

    this.start = Date.now();
    logger.debug("AmpqClient created");
    let that = this;
    process.on("SIGINT", function() {
      that.cleanup();
    });
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
      credentials: require("amqplib").credentials.plain(
        this.brokerUser,
        this.brokerPass
      )
    };
    let url = this.ampqUrl + "?heartbeat=60";
    logger.debug("Connecting to " + url);
    var that = this;
    try {
      this.connectToBroker(url, opt, async function(err, conn: Connection) {
        if (err) {
          logger.error("[AMQP] Error:" + err.message);
          logger.info("Waiting to reconnect");
          let timeout: number;
          if (that.reconnectAfterMilliSecs)
            timeout = that.reconnectAfterMilliSecs;
          else timeout = 6000;
          await AmqpClient.sleep(timeout);
          logger.info("reconnecting. Call count:" + that.retryCounter++);
          that.connect(cb);
          return;
        }
        //no error
        logger.info("[AMQP] definitely connected");
        that.myConn.connection = conn;
        that.myConn.connectionClosed = false;
        conn.on("close", async function() {
          if (that.destroyed) return;
          logger.error(
            "[AMQP] connection lost, reconnecting. Time:" +
              (Date.now() - that.start)
          );
          that.myConn.connectionClosed = true;
          that.connectAndDoSubscription(() => {
            that.setupPublishing(() =>
              logger.info(
                "Successfully connected after drop count:" +
                  ++that.successCounter +
                  ". Time:" +
                  (Date.now() - that.start)
              )
            );
          });
        });
        //}
        cb();
      });
    } catch (error) {
      logger.error("Error when trying to connect:" + error.message);
    }
  }

  //==1.connect and 2.subscribe
  private connectAndDoSubscription(cb?: () => void) {
    if (this.myConn.connection == undefined || this.myConn.connectionClosed) {
      this.connect(() => {});
    } else {
    }
  }

  async setupPublishing(cb?: () => void) {
    let that = this;
    function publishSetup() {
      logger.debug("Called setupPublishing");
      if (!that.myConn.connection) {
        throw new Error(
          "Message publisher could not be started due to the connection not being set up"
        );
      }
      logger.debug("Creating channel");
      that.myConn.connection.createChannel(function(err: any, ch: Channel) {
        if (err) {
          logger.error("Error thrown:" + err.message);
          return;
        }
        that.myConn.pubChannel = ch;
        logger.debug("Channel ready. Asserting exchange");

        that.myConn.pubChannel.assertExchange(that.brokerExchange, "topic", {
          durable: true
        });

        logger.debug("Exchange " + that.brokerExchange + " set up for topics");

        logger.debug("Calling publish callback");
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
      logger.debug("Cannot publish to closed channel");
      return;
    }
    if (!this.myConn.pubChannel) {
      logger.error("No publication channel available");
      return;
    }
    try {
      this.myConn.pubChannel.publish(
        this.brokerExchange,
        routingKey,
        Buffer.from(msg)
      );
      logger.debug(
        "amqp client sent to exchange " +
          this.brokerExchange +
          " with topic " +
          routingKey +
          " the following message'" +
          msg +
          "'"
      );
    } catch (error) {
      logger.error(
        "Error publishing, connection open but channel not ready (yet):"
      );

      //logger.error(error);
    }
  }

  cleanup() {
    logger.debug("Cleaning up");
    this.destroyed = true;
    if (this.myConn.connection && !this.myConn.connectionClosed) {
      this.myConn.connection.close(); //this takes time
      this.myConn.connectionClosed = true;
      logger.debug("Closed connection");
    }
  }
}

export { AmqpClient };
