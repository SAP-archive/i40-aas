# endpoint-resolver

## Overview
The *endpoint-resolver* consumes interaction messages from the `egress` exchange (binding `egress.generic`) of the central message broker. It extracts the frame from the transmitted JSON message and queries the *endpoint-registry* for matching endpoints using the following strategy:
```golang
// hierarchy of conditions; first conditions resolving to `true` commands the parameters used within the endpoint-registry query:
if iMsg.Frame.Receiver.Identification != nil {
  // use:
  // - Frame.Receiver.Identification.Id
  // - Frame.Receiver.Identification.IdType
} else if iMsg.Frame.Receiver.Role != nil {
  // use:
  // - Frame.Receiver.Role.Name
  // - Frame.SemanticProtocol
} else {
  // error
}
```

The [endpoint-registry](endpoint-registry.md) returns an array of receiver endpoints with varying protocols. The *endpoint-resolver* wraps the original message in a new enriched format (cf. below) per endpoint and publishes it to the `egress` exchange using the routingkey `egress.<PROTOCOL>` that is then further processed by corresponding *\<PROTOCOL\>-endpoint-egress* ([https](https-endpoint-egress.md)/[gRPC](grpc-endpoint-egress.md)) applications.

Resolver message struct:
```golang
type ResolverMsg struct {
	EgressPayload []byte
	ReceiverURL   string
	ReceiverType  string
}
```
Transmitted as RawJSON payload:
```json
{
	"EgressPayload": "<BASE64 encoded interaction message>",
	"ReceiverURL":   "string",
	"ReceiverType":  "string"
}
```
