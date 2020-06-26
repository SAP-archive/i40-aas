We opted for AMQP (v0.9.1) as messaging protocol and deploy a [RabbitMQ](https://www.rabbitmq.com/) broker for internal communication.


## Message Flow
(For an introduction about RabbitMQ exchanges and queues, routing keys and bindings see for instance [this blog](https://www.cloudamqp.com/blog/2015-09-03-part4-rabbitmq-for-beginners-exchanges-routing-keys-bindings.html))

We separate the message flow of incoming and outgoing messages by using two separate topic exchanges:
- `ingress` for incoming messages
- `egress` for outgoing messages

### Ingress Exchange

An _ingress_ (ref. [https](https-endpoint-ingress.md)/[gRPC](grpc-endpoint-ingress.md)) receives interaction messages and publishes them for further processing to the internal broker on the exchange __ingress__ with a routing key determined by the `semanticProtocol`, `receiverRoleName`, and `type` parameters of the I40 message as follows:
```
ingress.(semanticProtocol).(receiverRoleName).(type)
```

Any actor (_Skill_) wishing to receive incoming messages should consume from the broker with a binding matching this pattern.


### Egress Exchange

_Skills_ should publish outgoing messages to the exchange __egress__ with routing key `egress.generic`, since neither skill nor the interaction message itself know the message receiver.

The [_endpoint-resolver_](./endpoint-resolver.md) consumes payloads of the queue with binding pattern `egress.generic` and then retrieves matching receivers of the message and their external endpoints from the [_endpoint-registry_](./endpoint-registry.md).

The [_endpoint-resolver_](./endpoint-resolver.md) then publishes the message to `egress.<PROTOCOL>` for each receiving endpoint depending on the transport protocol (`http` or `grpc`). For a cloud target listening on HTTP for example, the message would be published to `egress.http`.

There is an _egress_ application per protocol (ref. [https](https-endpoint-egress.md)/[gRPC](grpc-endpoint-egress.md)), which consumes corresponding messages and transmits the message accordingly.
