package utils

import (
	"encoding/json"
	"log"

	"github.com/golang/protobuf/jsonpb"

	interaction "../../../proto/interaction"
)

// ConvertRawJSONToInteractionMessage TODO
func ConvertRawJSONToInteractionMessage(jsonRaw []byte) *interaction.InteractionMessage {
	dat := make(map[string]interface{})
	if err := json.Unmarshal(jsonRaw, &dat); err != nil {
		log.Printf("unable to Unmarshal jsonRaw: %s", err)
	}

	jsonFrameRaw, err := json.Marshal(dat["frame"])
	if err != nil {
		log.Printf("unable to Marshal dat[\"frame\"]: %s", err)
	}

	jsonFrame := string(jsonFrameRaw)

	protoFrame := &interaction.Frame{}
	jsonpb.UnmarshalString(jsonFrame, protoFrame)

	interactionElementsRaw, err := json.Marshal(dat["interactionElements"])
	if err != nil {
		log.Printf("unable to Marshal dat[\"interactionElements\"]: %s", err)
	}

	protoMessage := &interaction.InteractionMessage{
		Frame:               protoFrame,
		InteractionElements: interactionElementsRaw,
	}

	return protoMessage
}

// ConvertInteractionMessageToRawJSON TODO
func ConvertInteractionMessageToRawJSON(protoMessage *interaction.InteractionMessage) []byte {
	protoFrame := protoMessage.Frame
	marshaler := jsonpb.Marshaler{}
	jsonFrame, err := marshaler.MarshalToString(protoFrame)
	if err != nil {
		log.Printf("unable to MarshalToString protoFrame: %s", err)
	}

	interactionElementsRaw := protoMessage.InteractionElements

	jsonString := "{\"frame\":" + jsonFrame + ",\"interactionElements\":" + string(interactionElementsRaw) + "}"
	jsonRaw := []byte(jsonString)

	return jsonRaw
}
