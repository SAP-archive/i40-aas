package firstgrpc

import (
	"context"
	"io"
	"log"
	"os"

	"github.com/pkg/errors"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"

	//fileservice "github.com/SAP/i40-aas/apps/proto/fileservice"
	fileservice "../../../proto/fileservice"
	//interaction "github.com/SAP/i40-aas/apps/proto/interaction"
	interaction "../../../proto/interaction"
)

// GRPCClient provides the implementation of a file
// uploader that streams chunks via protobuf-encoded
// messages.
type GRPCClient struct {
	Conn              *grpc.ClientConn
	fileClient        fileservice.AASFileServiceClient
	interactionClient interaction.InteractionServiceClient
	chunkSize         int
	Config            GRPCClientConfig
}

// GRPCClientConfig conf
type GRPCClientConfig struct {
	Address         string
	ChunkSize       int
	RootCertificate string
	Compress        bool
}

// NewGRPCClient take configs and return a new instance of GRPCClient
func NewGRPCClient(cfg GRPCClientConfig) (c GRPCClient, err error) {
	var (
		grpcOpts  = []grpc.DialOption{}
		grpcCreds credentials.TransportCredentials
	)

	c.Config = cfg

	if cfg.Address == "" {
		err = errors.Errorf("address must be specified")
		return
	}

	if cfg.Compress {
		grpcOpts = append(grpcOpts,
			grpc.WithDefaultCallOptions(grpc.UseCompressor("gzip")))
	}

	if cfg.RootCertificate != "" {
		grpcCreds, err = credentials.NewClientTLSFromFile(cfg.RootCertificate, "localhost")
		if err != nil {
			err = errors.Wrapf(err,
				"failed to create grpc tls client via root-cert %s",
				cfg.RootCertificate)
			return
		}

		grpcOpts = append(grpcOpts, grpc.WithTransportCredentials(grpcCreds))
	} else {
		grpcOpts = append(grpcOpts, grpc.WithInsecure())
	}

	switch {
	case cfg.ChunkSize == 0:
		err = errors.Errorf("ChunkSize must be specified")
		return
	case cfg.ChunkSize > (1 << 22):
		err = errors.Errorf("ChunkSize must be < than 4MB")
		return
	default:
		c.chunkSize = cfg.ChunkSize
	}

	c.Conn, err = grpc.Dial(cfg.Address, grpcOpts...)
	if err != nil {
		err = errors.Wrapf(err,
			"failed to start grpc connection with address %s",
			cfg.Address)
		return
	}

	c.fileClient = fileservice.NewAASFileServiceClient(c.Conn)
	c.interactionClient = interaction.NewInteractionServiceClient(c.Conn)

	return
}

// Close GRPC connection
func (c *GRPCClient) Close(ctx context.Context) {
	if c.Conn != nil {
		c.Conn.Close()
	}
}

// Upload specified file to GRPCServer
func (c *GRPCClient) Upload(ctx context.Context, f string) (err error) {
	var (
		buf    []byte
		n      int
		file   *os.File
		status *fileservice.UploadStatus
	)
	log.Printf("Uploading %s", f)

	file, err = os.OpenFile(f, os.O_RDONLY, 0400)
	if err != nil {
		err = errors.Wrapf(err,
			"failed to open file %s",
			f)
		return
	}
	defer file.Close()

	stream, err := c.fileClient.Upload(ctx)
	if err != nil {
		err = errors.Wrapf(err,
			"failed to create upload stream for file %s",
			f)
		return
	}
	defer stream.CloseSend()

	buf = make([]byte, c.chunkSize)
	for {
		n, err = file.Read(buf)
		if err != nil {
			if err == io.EOF {
				goto END
			}

			log.Printf("errored while copying from file to buf: %s", err)
			return
		}

		err = stream.Send(&fileservice.Chunk{
			Content:  buf[:n],
			FileName: file.Name(),
		})
		if err != nil {
			log.Print(err)
		}
	}

END:
	status, err = stream.CloseAndRecv()
	if err != nil {
		log.Printf("failed to receive upstream status response: %s", err)
		return
	}

	if status.Code != fileservice.UploadStatusCode_Ok {
		log.Printf("upload failed - msg: %s", status.Message)
		return
	}

	log.Printf("%s", status.Message)

	return
}

// Download specified file from GRPCServer
func (c *GRPCClient) Download(ctx context.Context, f string) (err error) {
	var (
		file  *os.File
		chunk *fileservice.Chunk
	)

	file, err = os.OpenFile(f+"_new", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
	if err != nil {
		log.Printf("failed to open file: %s", err)
		return
	}
	defer file.Close()

	stream, err := c.fileClient.Download(ctx, &fileservice.DownloadRequest{
		FileName: f,
	})

	for {
		chunk, err = stream.Recv()
		if err != nil {
			if err == io.EOF {
				goto END
			}
			log.Printf("failed reading chunks from stream: %s", err)
			return
		}

		_, err = file.Write(chunk.GetContent())
		if err != nil {
			log.Printf("failed to write to file: %s", err)
			return
		}
	}

END:
	log.Printf("download successful")

	return
}
