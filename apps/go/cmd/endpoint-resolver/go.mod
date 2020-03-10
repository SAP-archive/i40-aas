module endpoint-resolver

go 1.13

require (
	github.com/SAP/i40-aas/src/go/pkg/amqpclient v0.0.0-00010101000000-000000000000
	github.com/SAP/i40-aas/src/go/pkg/interaction v0.0.0-00010101000000-000000000000
	github.com/SAP/i40-aas/src/go/pkg/logging v0.0.0
	github.com/joho/godotenv v1.3.0
	github.com/rs/zerolog v1.18.0
	github.com/streadway/amqp v0.0.0-20200108173154-1c71cc93ed71
)

replace github.com/SAP/i40-aas/src/go/pkg/amqpclient => ../../pkg/amqpclient

replace github.com/SAP/i40-aas/src/go/pkg/interaction => ../../pkg/interaction

replace github.com/SAP/i40-aas/src/go/pkg/logging => ../../pkg/logging
