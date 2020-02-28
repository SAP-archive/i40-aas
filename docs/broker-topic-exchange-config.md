For internal communication between the parts within the AAS Service we mainly use a message broker. 

We deciced for AQMP (v0.9.1) as our messaging protocol and deploy the open source [RabbitMQ](https://www.rabbitmq.com/) to handle the messaging.  

## Message Flow 

(For an introduction about RabbitMQ exchanges and queues, routing keys and bindings see for instance [this blog](https://www.cloudamqp.com/blog/2015-09-03-part4-rabbitmq-for-beginners-exchanges-routing-keys-bindings.html))

We seperate the message flow of incoming and outgoing messages by using two seperate topic exchanges:  
The exchange `ingress` for all incoming messages.  
The exchange `egress` for all outgoing messages.

### Ingress Exchange

An _ingress_ receives a "I40 Interaction Message" and publishes it for any further processing to the internal message broker on the exchange topic __Ingress__ and with a routing key that is determined by the `semanticProtocol`, `receiverRoleName`, and `type` parameter of the I40 message in the following way:  
```
Ingress.(semanticProtocol).(receiverRoleName).(type).#
```

Any actor (_Skill_) wishing to receive incoming messages consumes a queue from the broker with a binding pattern that matches this key pattern. 



### Egress Exchange

Outgoing messages are handled in several steps.

At first, a _skill_ publishes the outgoing message to the broker exchange __Egress__ with the message routing key `Egress.Generic.#` since the skill and the message itself do not know the message receiver. 

The _endpoint-resolver_ consumes the payloads of the queue with binding pattern `Egress.Generic.#` and retrieves the receivers of the message and their external endpoints from the `endpoint-registry`.

The _endpoint_resolver_ then republishes the message to the __Egress__ exchange with a different routing key depending on whether the receiver is a cloud or edge instance and depending on the transport protocol (`HTTP` or `gRPC`) in the following way:
```
Egress.(protocol).(instanceType).#
```

For a cloud target instance listening on HTTP for example, the message would be published to 
```
Egress.HTTP.cloud.#
```

Any _egress_ service can consume a queue on the __Egress__ exchange with a binding matching this routing pattern, to process and finally send the message accordingly.  
