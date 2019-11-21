# Https-endpoint-egress

This component listens to messages published to the broker from skills polls the registry to get the client URLs based on their IDs or role, and forwards the response to their respective receivers.

The component subscribes to topics with the following keys:

`http.client`

The message should contain an interaction form.

- Read the `{receiver.identification.id}` from the `frame` of the interaction
- Make a POST to `REGISTRY_URL/read` with param `{id = receiver.id}`
- Get the receiver endpoint URL from the registry service component using the ID of the receiver
- Make a POST to the AAS-Client (eg. Operator) endpoint with the interaction message in body (the operator, in case case of an onboarding process)

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.
<<<<<<< HEAD
=======

>>>>>>> master
