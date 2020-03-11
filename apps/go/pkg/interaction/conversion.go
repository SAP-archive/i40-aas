package interaction

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/golang/protobuf/jsonpb"
	"github.com/rs/zerolog/log"
)

// NewInteractionMessage returns a new InteractionMessage
func NewInteractionMessage(i interface{}) (im *InteractionMessage, err error) {
	switch v := i.(type) {
	case []byte:
		im, err = fromRawJSON(v)
	case string:
		im, err = fromString(v)
	default:
		log.Error().Msgf("type %T cannot be converted to InteractionMessage", v)
		err = fmt.Errorf("type %T cannot be converted to InteractionMessage", v)
		return nil, err
	}
	return im, err
}

// fromString initializes a new InteractionMessage from a string containing
// a corresponding JSON
func fromString(jsonString string) (im *InteractionMessage, err error) {
	im, err = fromRawJSON([]byte(jsonString))
	return im, err
}

// fromRawJSON initializes a new InteractionMessage from bytes containing
// a corresponding JSON
func fromRawJSON(rawJSON []byte) (*InteractionMessage, error) {
	im := &InteractionMessage{}
	dat := make(map[string]interface{})
	err := json.Unmarshal(rawJSON, &dat)
	if err != nil {
		log.Error().Err(err).Msg("failed to Unmarshal rawJSON")
		return nil, err
	}

	_, ok := dat["frame"].(map[string]interface{})
	if !ok {
		log.Error().Err(err).Msg("rawJSON does not contain frame or frame is not an object")
		err = fmt.Errorf("rawJSON does not contain frame or frame is not an object")
		return nil, err
	}
	jsonFrameRaw, err := json.Marshal(dat["frame"])
	if err != nil {
		// reverse operatrion to Unmarshal above
		// if err != nil there might be a bug in json Marshal/Unmarshal
		log.Error().Err(err).Msg("failed to Marshal frame")
		return nil, err
	}
	jsonFrame := string(jsonFrameRaw)

	protoFrame := &Frame{}
	err = jsonpb.UnmarshalString(jsonFrame, protoFrame)
	if err != nil {
		log.Error().Err(err).Msg("failed to UnmarshalString frame to proto")
		return nil, err
	}

	_, ok = dat["interactionElements"].([]interface{})
	if !ok {
		log.Error().Err(err).Msg("rawJSON does not contain interactionElements or interactionElements is not an array")
		err = fmt.Errorf("rawJSON does not contain interactionElements or interactionElements is not an array")
		return nil, err
	}
	interactionElementsRaw, err := json.Marshal(dat["interactionElements"])
	if err != nil {
		// reverse operatrion to Unmarshal above
		// if err != nil there might be a bug in json Marshal/Unmarshal
		log.Error().Err(err).Msg("failed to Marshal interactionElements")
		return nil, err
	}

	im = &InteractionMessage{
		Frame:               protoFrame,
		InteractionElements: interactionElementsRaw,
	}

	return im, nil
}

// ToRawJSON returns a JSON representation of an InteractionMessage as bytes
func (im *InteractionMessage) ToRawJSON() ([]byte, error) {
	jsonString, err := im.ToString()
	if err != nil {
		return nil, err
	}

	return []byte(jsonString), nil
}

// ToString returns a JSON representation of an InteractionMessage as string
func (im *InteractionMessage) ToString() (jsonString string, err error) {
	protoFrame := im.Frame
	marshaler := jsonpb.Marshaler{}
	jsonFrame, err := marshaler.MarshalToString(protoFrame)
	if err != nil {
		log.Error().Err(err).Msg("failed to MarshalToString protoFrame")
		return "", err
	}

	if bytes.Compare(im.InteractionElements, []byte{}) == 0 {
		err = fmt.Errorf("InteractionElements cannot be nil")
		log.Error().Err(err).Msg("InteractionElements cannot be nil")
		return "", err
	}
	interactionElementsRaw := im.InteractionElements

	jsonString = "{\"frame\":" + jsonFrame + ",\"interactionElements\":" + string(interactionElementsRaw) + "}"

	return jsonString, nil
}
