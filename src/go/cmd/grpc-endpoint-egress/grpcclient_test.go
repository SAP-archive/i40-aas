package main

import (
	"github.com/SAP/i40-aas/src/go/pkg/interaction"
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
