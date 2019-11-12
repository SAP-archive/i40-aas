# Https-endpoint-egress

This component listens to messages published to the broker from skills polls the registry to get the client URLs based on their IDs or role, and forwards the response to their respective receivers.

The component subscribes to topics with the following keys:

`http.client`

The message should contain an interaction form.

- Read the `{receiver.identification.id}` from the `frame` of the interaction
- Make a POST to `REGISTRY_URL/read` with param `{id = receiver.id}`
- Get the receiver endpoint URL from the registry service component using the ID of the receiver
- Make a POST to the AAS-Client (eg. Operator) endpoint with the interaction message in body (the operator, in case case of an onboarding process)


## Environment Variables

Message Broker Access (owned by broker-service):
```
- AMQP_URL: the URL of the AMQP broker
- BROKER_EXCHANGE: the name of the exchange
- BROKER_TOPIC_EGRESS: the name topic to subscribe to
- BROCKER_QUEUE: the broker queue name (note default to "endpoint-egress")
- BROKER_USER: broker access username
- BROKER_PASSWORD: broker access password
- BROKER_TOPIC_EGRESS: the topic to subscribe to
```

Endpoint-Registry Access (owned by endpoint-registry service):
``` 
- ENDPOINT_REGISTRY_BASE_URL : URL of Endpoint-registry (without the /endpoint suffix)
- ENDPOINT_REGISTRY_BASE_URL_GET_ENDPOINTS_SUFFIX: (the endpoint-registry endpoint to GET the AAS endpoints) (NOTE: should be set to "/endpoints")
- REGISTRY_ADMIN_USER (should be renamed to ENDPOINT-REG-USER)
- REGISTRY_ADMIN_PASSWORD (should be renamed to ENDPOINT-REG-PASS))
```