# https-endpoint-egress

## Configuration
Configuration is handled via environment variables. In the `environment:` section of the container in `docker-compose.yml` is a full list of environment variables, some of which can be configured via the `.env` file located in the repository root.

## Overview

This component listens to messages published to the broker from skills, and forwards the interaction message contained in them to their respective receivers-AAS.



The message received from the broker should have the following structure :
```
{
  "EgressPayload": "Interaction-Message",
  "ReceiverURL": "The Url of the Receiver-AAS,
  "ReceiverType": "cloud / edge"
}
```
What the service does:
- The component subscribes to broker topics with the following keys: `egress.http` and listens for messages from the `endpoint-resolver` service.
- Read the receiver endpoint URL (`{ReceiverURL}`) from the broker message
- Make a POST to the AAS-Receiver (eg. Operator) endpoint with the interaction message in body (eg. the operator, in case case of an onboarding process)
- Logs the response of the AAS-Receiver
