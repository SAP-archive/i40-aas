module grpc-endpoint-ingress

go 1.13

require (
	github.com/SAP/i40-aas/src/go/pkg/amqpclient v0.0.0
	github.com/SAP/i40-aas/src/go/pkg/interaction v0.0.0
	github.com/SAP/i40-aas/src/go/pkg/logging v0.0.0
	github.com/joho/godotenv v1.3.0
	github.com/rs/zerolog v1.18.0
	google.golang.org/grpc v1.27.1
)

replace github.com/SAP/i40-aas/src/go/pkg/interaction => ../../pkg/interaction

replace github.com/SAP/i40-aas/src/go/pkg/logging => ../../pkg/logging

replace github.com/SAP/i40-aas/src/go/pkg/amqpclient => ../../pkg/amqpclient
