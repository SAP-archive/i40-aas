package grpcendpoint

import (
	"context"
	"testing"

	"github.com/jpillora/backoff"

	"../interaction"
)

func dummyInteractionMessage() *interaction.InteractionMessage {
	iReceiverID := &interaction.Identification{
		Id:     "SAP_CentralAssetRepository",
		IdType: "IRI",
	}
	iReceiverRole := &interaction.Role{
		Name: "CentralAssetRepository",
	}
	iReceiver := &interaction.ConversationMember{
		Identification: iReceiverID,
		Role:           iReceiverRole,
	}

	iSenderID := &interaction.Identification{
		Id:     "https://i40-test-aas-server.cfapps.eu10.hana.ondemand.com/aas",
		IdType: "IRI",
	}
	iSenderRole := &interaction.Role{
		Name: "Operator",
	}

	iSender := &interaction.ConversationMember{
		Identification: iSenderID,
		Role:           iSenderRole,
	}

	iFrame := &interaction.Frame{
		SemanticProtocol: "i40:registry-semanticProtocol/onboarding",
		Type:             "publishInstance",
		MessageId:        "Sample_Msg_ID_005",
		ReplyBy:          29993912,
		Receiver:         iReceiver,
		Sender:           iSender,
		ConversationId:   "",
	}

	interactionElements := []byte{}

	protoMessage := &interaction.InteractionMessage{
		Frame:               iFrame,
		InteractionElements: interactionElements,
	}

	return protoMessage
}

func dummyClient() grpcClient {
	cltConfig := GRPCClientConfig{
		URL:      "localhost:51423",
		RootCert: "",
	}

	c := newGRPCClient(cltConfig)
	return *c
}

func dummyServer() grpcServer {
	grpcSrvCfg := GRPCServerConfig{
		Port: 51423,
		Cert: "",
		Key:  "",
	}

	grpcSrv := newGRPCServer(grpcSrvCfg)
	go grpcSrv.init()

	return grpcSrv
}

func init() {
	srv := dummyServer()
	defer srv.close()
}

func TestNewGRPCClient(t *testing.T) {
	// c := dummyClient()

	// if c.conn.GetState().String() != "IDLE" {
	// 	t.Errorf("ClientConn was initiated, but remains %s", c.conn.GetState().String())
	// }

	// // Wait till connection has been established and State changes.
	// for c.conn.GetState().String() == "IDLE" {
	// 	time.Sleep(time.Millisecond * 50)
	// }

	// if c.conn.GetState().String() != "READY" {
	// 	t.Errorf("ClientConn was initiated, but remains %s", c.conn.GetState().String())
	// }
}

func TestUploadInteractionMessage(t *testing.T) {
	c := dummyClient()

	iMsg := dummyInteractionMessage()

	_, err := c.interactionClient.UploadInteractionMessage(context.Background(), iMsg)
	if err != nil {
		t.Errorf("UploadInteractionMessage failed: %s", err)
	}

	c.UploadInteractionMessage(iMsg, &backoff.Backoff{})
}
