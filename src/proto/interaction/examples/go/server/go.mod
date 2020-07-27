module client

go 1.13

require (
	github.com/golang/protobuf v1.4.2
	github.com/sap/i40-aas/interaction v0.0.0-00010101000000-000000000000
	google.golang.org/grpc v1.27.1
	google.golang.org/protobuf v1.25.0 // indirect
)

replace github.com/sap/i40-aas/interaction => ../interaction/github.com/sap/i40-aas/interaction
