# https-endpoint-egress

## Overview

The **https-endpoint-egress** listens to messages published to the AMQP topic `egress.http` and forwards the contained interaction message to a receiving AAS instance (ref.: [*https-endpoint-ingress*](./https-endpoint-ingress)). Messages received from the broker passed through the [endpoint resolver](./endpoint-resolver.md) and are marshaled from the following Go struct:
```go
type ResolverMsg struct {
	EgressPayload    []byte
	ReceiverURL      string
	ReceiverProtocol string
	ReceiverType     string
	ReceiverCert     string
	ReceiverUser     string
	ReceiverPassword string
}
```

The **https-endpoint-egress**:
- reads the receiver endpoint URL (`ReceiverURL`) from the resolver message
- checks whether a `ReceiverCert` exists and TLS is enabled for the AAS instance (ref. [TLS enablement](../../src/compose/volumes/certs/README.md)) and opts in/out of TLS encryption
- checks whether `ReceiverUser` and `ReceiverPassword` are set for Basic Auth
- makes a POST to the AAS-Receiver (e.g. Operator, in case of an onboarding process) endpoint with the interaction message as body
- Logs the status and response of the receiving server
