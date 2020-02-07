package firstgrpc

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strconv"

	"github.com/streadway/amqp"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	//fileservice "github.com/SAP/i40-aas/apps/grpc-endpoint/proto/fileservice"
	fileservice "../../../proto/fileservice"
	//interaction "github.com/SAP/i40-aas/apps/proto/interaction"
	interaction "../../../proto/interaction"
)

// GRPCServer wraps grpc.Server and corresponding GRPCServerConfig
type GRPCServer struct {
	server      *grpc.Server
	amqpConn    *amqp.Connection
	amqpChan    *amqp.Channel
	amqpQ       *amqp.Queue
	port        int
	certificate string
	key         string
	chunkSize   int
	compress    bool
}

// GRPCServerConfig wraps configs for GRPCServer
type GRPCServerConfig struct {
	Port        int
	Certificate string
	Key         string
	ChunkSize   int
	Compress    bool
}

// NewGRPCServer take configs and return a new instance of GRPCServer
func NewGRPCServer(cfg GRPCServerConfig) (s GRPCServer, err error) {
	if cfg.Port == 0 {
		log.Fatal("Port must be specified")
		return
	}

	s.port = cfg.Port
	s.certificate = cfg.Certificate
	s.key = cfg.Key
	s.chunkSize = cfg.ChunkSize
	s.compress = cfg.Compress

	amqpHost := os.Getenv("RABBITMQ_AMQP_HOST")
	amqpPort := os.Getenv("RABBITMQ_AMQP_PORT")
	amqpUser := os.Getenv("RABBITMQ_BROKER_USER")
	amqpPassword := os.Getenv("RABBITMQ_BROKER_PASSWORD")
	amqpExchange := os.Getenv("RABBITMQ_BROKER_EXCHANGE")

	amqpConn, err := amqp.Dial(fmt.Sprintf("amqp://%s:%s@%s:%s/", amqpUser, amqpPassword, amqpHost, amqpPort))
	if err != nil {
		log.Fatalf("Failed to connect to RabbitMQ: %s", err)
	}
	s.amqpConn = amqpConn

	amqpChan, err := amqpConn.Channel()
	if err != nil {
		log.Fatalf("Failed to open a channel: %s", err)
	}
	s.amqpChan = amqpChan

	amqpChan.ExchangeDeclare(
		amqpExchange, // name
		"topic",      //type
		true,         // durable
		false,        // delete when unused
		false,        // exclusive
		false,        // no-wait
		nil,          // arguments
	)
	return
}

// Close closes the serves of GRPCServer
func (s *GRPCServer) Close(ctx context.Context) {
	if s.amqpChan != nil {
		s.amqpChan.Close()
	}
	if s.amqpChan != nil {
		s.amqpChan.Close()
	}
	if s.server != nil {
		s.server.Stop()
	}

	return
}

// Listen initializes the listening of a GRPCServer
func (s *GRPCServer) Listen() (err error) {
	var (
		listener  net.Listener
		grpcOpts  = []grpc.ServerOption{}
		grpcCreds credentials.TransportCredentials
	)

	listener, err = net.Listen("tcp", "localhost:"+strconv.Itoa(s.port))
	if err != nil {
		log.Fatalf("failed to listen on port %d", s.port)
	}

	if s.certificate != "" && s.key != "" {
		grpcCreds, err = credentials.NewServerTLSFromFile(
			s.certificate, s.key)
		if err != nil {
			log.Fatalf("failed to create tls grpc server using cert %s and key %s", s.certificate, s.key)
		}

		grpcOpts = append(grpcOpts, grpc.Creds(grpcCreds))
	}

	s.server = grpc.NewServer(grpcOpts...)

	fileservice.RegisterAASFileServiceServer(s.server, s)
	interaction.RegisterInteractionServiceServer(s.server, s)

	log.Printf("starting GRPCServer on port %v", strconv.Itoa(s.port))
	err = s.server.Serve(listener)
	if err != nil {
		log.Printf("errored listening for grpc connections: %s", err)
		return
	}

	return
}

// Upload capability
func (s *GRPCServer) Upload(stream fileservice.AASFileService_UploadServer) (err error) {
	var (
		file  *os.File
		chunk *fileservice.Chunk
	)

	for {
		chunk, err = stream.Recv()
		if err != nil {
			if err == io.EOF {
				goto END
			}
			log.Printf("failed reading chunks from stream: %s", err)
			return
		}

		if file == nil || file.Name() != chunk.GetFileName() {
			file, err = os.OpenFile(chunk.GetFileName(), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
			if err != nil {
				log.Printf("failed to open file: %s", err)
				return
			}
			defer file.Close()
		}

		_, err = file.Write(chunk.GetContent())
		if err != nil {
			log.Printf("failed to write to file: %s", err)
			return
		}
	}

END:
	log.Printf("upload of %s successful", file.Name())

	err = stream.SendAndClose(&fileservice.UploadStatus{
		Message: "Upload successful (" + file.Name() + ")",
		Code:    fileservice.UploadStatusCode_Ok,
	})
	if err != nil {
		log.Printf("failed to send status code: %s", err)
		return
	}

	return
}

// Download capability
func (s *GRPCServer) Download(dlreg *fileservice.DownloadRequest, stream fileservice.AASFileService_DownloadServer) (err error) {
	var (
		file *os.File
		buf  []byte
		n    int
	)

	file, err = os.OpenFile(dlreg.GetFileName(), os.O_RDONLY, 0400)
	if err != nil {
		log.Printf("failed to open file: %s", err)
		return
	}
	defer file.Close()

	buf = make([]byte, s.chunkSize)
	for {
		n, err = file.Read(buf)
		if err != nil {
			if err == io.EOF {
				goto END
			}

			log.Printf("errored while copying from file to buf: %s", err)
			return
		}

		if err := stream.Send(&fileservice.Chunk{
			Content:  buf[:n],
			FileName: file.Name(),
		}); err != nil {
			log.Print(err)
			return err
		}
	}

END:
	log.Printf("download of %s successful", file.Name())

	return nil
}

// UploadInteractionMessage capability
func (s *GRPCServer) UploadInteractionMessage(context.Context, *interaction.InteractionMessage) (*interaction.InteractionStatus, error) {
	return nil, nil
}

// UploadInteractionMessageStream capability
func (s *GRPCServer) UploadInteractionMessageStream(stream interaction.InteractionService_UploadInteractionMessageStreamServer) error {
	return nil
}

func (s *GRPCServer) forwardToAMQP() error {
	body := "Hello World!"
	routingKey := fmt.Sprintf("%s.%s.%s", "a.Spec.Frame.SemanticProtocol", "a.Spec.Frame.Receiver.Role.Name", "a.Spec.Frame.Type")

	if err := s.amqpChan.Publish(
		os.Getenv("RABBITMQ_BROKER_EXCHANGE"),
		routingKey, // routing key
		false,      // mandatory
		false,      // immediate
		amqp.Publishing{
			Headers:         amqp.Table{},
			ContentType:     "application/json",
			ContentEncoding: "utf8",
			Body:            []byte(body),
			DeliveryMode:    amqp.Transient, // 1=non-persistent, 2=persistent
			Priority:        0,              // 0-9
		}); err != nil {
		return fmt.Errorf("Publishing message to Exchange %s failed: %v", os.Getenv("RABBITMQ_BROKER_EXCHANGE"), err)
	}

	return nil
}
