import * as logger from "winston";
import * as amqp from "amqplib/callback_api";
import {
  Connection,
  Channel,
  ConsumeMessage,
  Replies
} from "amqplib/callback_api";

import { Subscription } from "./interfaces/Subscription";
import { IMessageBrokerClient } from "./interfaces/IMessageBrokerClient";

class AmqpConnectionDetails {
  connection: Connection | undefined;
  connectionClosed: boolean = true;
  pubChannel: Channel | undefined;
  subscription: Subscription | undefined;
}

//TODO: set proper time gap for connection retries (6s currently).
//TODO: not to use static methods
class AmqpClient implements IMessageBrokerClient {
  private static myConn: AmqpConnectionDetails = new AmqpConnectionDetails();
  private static listenerQName: string;
  public static listenerCounter = 0;
  public static retryCounter = 0;
  public static successCounter = 0;
  public static start: number;
  private ampqUrl: string;

  constructor(
    private brokerHost: string,
    private brokerPort: string,
    private brokerExchange: string,
    private brockerUser: string,
    private brokerPass: string,
    uniqueListenerId: string,
    useMqtt?: boolean
  ) {
    (this.ampqUrl = "amqp://" + brokerHost + ":" + brokerPort),
      (AmqpClient.start = Date.now());
    AmqpClient.listenerQName = uniqueListenerId;
    logger.debug("AmpqClient created");
    process.on("SIGINT", function() {
      AmqpClient.cleanup();
    });
  }

  private static sleep(millis: number) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }

  private static doConnection(
    cb: () => void,
    user: string,
    pass: string,
    ampqUrl: string,
    myConn: AmqpConnectionDetails,
    brokerExchange: string
  ) {
    let opt = {
      credentials: require("amqplib").credentials.plain(user, pass)
    };
    let url = ampqUrl + "?heartbeat=60";
    logger.debug("Connecting to " + url);
    try {
      amqp.connect(url, opt, async function(err, conn: Connection) {
        if (err) {
          logger.error("[AMQP]:" + err.message);
          //return;
          logger.info("Waiting to reconnect");
          await AmqpClient.sleep(6000);
          logger.info("reconnecting. Call count:" + AmqpClient.retryCounter++);
          //TODO: recursion, watch out for stack overflow
          AmqpClient.doConnection(
            cb,
            user,
            pass,
            ampqUrl,
            myConn,
            brokerExchange
          );
          return;
        }
        //no error
        logger.info("[AMQP] connected");
        myConn.connection = conn;
        myConn.connectionClosed = false;
        //if (myConn.subscription) {
        conn.on("close", async function() {
          logger.error(
            "[AMQP] connection lost, reconnecting. Time:" +
              (Date.now() - AmqpClient.start)
          );
          myConn.connectionClosed = true;
          AmqpClient.connectAndDoSubscription(
            brokerExchange,
            myConn,
            user,
            pass,
            ampqUrl,
            () => {
              AmqpClient.doSetupPublishing(
                user,
                pass,
                brokerExchange,
                ampqUrl,
                myConn
              );
            }
          );
          logger.info(
            "Successfully connected after drop count:" +
              ++AmqpClient.successCounter +
              ". Time:" +
              (Date.now() - AmqpClient.start)
          );
        });
        //}
        cb();
      });
    } catch (error) {
      logger.error("Error when trying to connect:" + error.message);
    }
  }

  addSubscriptionData(subscription: Subscription) {
    AmqpClient.myConn.subscription = subscription;
  }

  private static doSubscription(
    myConn: AmqpConnectionDetails,
    brokerExchange: string,
    cb?: () => void
  ) {
    if (!myConn.subscription) {
      if (cb) cb();
      return;
    }

    if (myConn.connectionClosed) {
      logger.error("Cannot subscribe as connection closed");
      return;
    }
    if (!myConn.connection) {
      throw new Error(
        "Message listener could not be started due to the connection not being set up"
      );
    }

    myConn.connection.createChannel(function(err, ch: Channel) {
      if (err) {
        logger.error("Error thrown:" + err.message);
        //throw err;
        return;
      }

      //TODO: durable correct?
      ch.assertExchange(brokerExchange, "topic", { durable: true });

      ch.assertQueue(AmqpClient.listenerQName, { exclusive: false }, function(
        error2,
        q
      ) {
        if (error2) {
          logger.error("Error thrown:" + error2.message);
          //throw error2;
          return;
        }

        if (myConn.subscription) {
          myConn.subscription.topicsArray.forEach(function(topic) {
            logger.info(
              "Listener started. Waiting for messages in " +
                q.queue +
                " for topic " +
                topic +
                ". Call count: " +
                ++AmqpClient.listenerCounter
            );

            logger.info("[AMQP] Binding with key: " + topic);

            ch.bindQueue(q.queue, brokerExchange, topic);
          });
        } else {
          logger.error(
            "Attempting to set up a subscription even though none was provided."
          );
        }
        ch.consume(
          q.queue,
          function(msg: ConsumeMessage | null) {
            if (msg === null) {
              throw Error("Null message received!");
            }
            if (myConn.subscription) {
              myConn.subscription.messageReceiver.receive(
                msg.content.toString()
              );
            } else {
              logger.error(
                "Attempting to set up a subscription even though none was provided."
              );
            }
          },
          { noAck: true }
        );
      });

      if (cb) cb();
    });
  }

  //==1.connect and 2.subscribe
  private static connectAndDoSubscription(
    brokerExchange: string,
    myConn: AmqpConnectionDetails,
    user: string,
    pass: string,
    amqpUrl: string,

    cb?: () => void
  ) {
    if (myConn.connection == undefined || myConn.connectionClosed) {
      AmqpClient.doConnection(
        () => {
          AmqpClient.doSubscription(myConn, brokerExchange, cb);
        },
        user,
        pass,
        amqpUrl,
        myConn,
        brokerExchange
      );
    } else {
      AmqpClient.doSubscription(myConn, brokerExchange, cb);
    }
  }

  startListening(cb?: () => void) {
    if (!AmqpClient.myConn.subscription) {
      if (cb) cb();
    } else {
      AmqpClient.connectAndDoSubscription(
        this.brokerExchange,
        AmqpClient.myConn,
        this.brockerUser,
        this.brokerPass,
        this.ampqUrl,
        cb
      );
    }
  }

  setupPublishing(cb: () => void) {
    AmqpClient.doSetupPublishing(
      this.brockerUser,
      this.brokerPass,
      this.brokerExchange,
      this.ampqUrl,
      AmqpClient.myConn,
      cb
    );
  }

  private static doSetupPublishing(
    brokerUser: string,
    brokerPass: string,
    brokerExchange: string,
    amqpUrl: string,
    myConn: AmqpConnectionDetails,
    cb?: () => void
  ) {
    function publishSetup() {
      logger.debug("Called setupPublishing");
      if (!AmqpClient.myConn.connection) {
        throw new Error(
          "Message publisher could not be started due to the connection not being set up"
        );
      }
      logger.debug("Creating channel");
      AmqpClient.myConn.connection.createChannel(function(
        err: any,
        ch: Channel
      ) {
        if (err) {
          logger.error("Error thrown:" + err.message);
          return;
        }
        myConn.pubChannel = ch;
        logger.debug("Channel ready. Asserting exchange");

        myConn.pubChannel.assertExchange(brokerExchange, "topic", {
          durable: true
        });

        logger.debug("Exchange " + brokerExchange + " set up for topics");

        logger.debug("Calling publish callback");
        if (cb) cb();
      });
    }

    if (myConn.connection == undefined || myConn.connectionClosed) {
      AmqpClient.doConnection(
        publishSetup,
        brokerUser,
        brokerPass,
        amqpUrl,
        myConn,
        brokerExchange
      );
    } else {
      publishSetup();
    }
  }

  //TODO: messages get lost if the broker goes down, adjust durability? have queue at client side?
  //TODO: it should take an object (not a string) and stringify it here to make testing easier
  //TODO: make sure setupPublish called before, or call it explicitly
  publish(routingKey: string, msg: string) {
    if (AmqpClient.myConn.connectionClosed) {
      logger.debug("Cannot publish to closed channel");
      return;
    }
    if (!AmqpClient.myConn.pubChannel) {
      logger.error("No publication channel available");
      return;
    }
    try {
      AmqpClient.myConn.pubChannel.publish(
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

  public static cleanup() {
    logger.debug("Cleaning up");
    if (AmqpClient.myConn.connection && !AmqpClient.myConn.connectionClosed) {
      AmqpClient.myConn.connection.close(); //this takes time
      AmqpClient.myConn.connectionClosed = true;
      logger.debug("Closed connection");
    }
  }
}

export { AmqpClient };
