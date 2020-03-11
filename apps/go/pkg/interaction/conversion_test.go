package interaction

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"strings"
	"testing"
)

var (
	testString             string
	testRawJSON            []byte
	testInteractionMessage *InteractionMessage
)

func init() {
	// read paragon for valid InteractionMessage from local .json file
	jsonFile, err := os.Open("testmessage.json")
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()
	jsonFileContent, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		fmt.Println(err)
	}

	// construct matching InteractionMessage struct from scratch
	iReceiverID := &Identification{
		Id:     "CentralAssetRepository",
		IdType: "IRI",
	}
	iReceiverRole := &Role{
		Name: "Operator",
	}
	iReceiver := &ConversationMember{
		Identification: iReceiverID,
		Role:           iReceiverRole,
	}
	iSenderID := &Identification{
		Id:     "localhost",
		IdType: "IRI",
	}
	iSenderRole := &Role{
		Name: "Operator",
	}
	iSender := &ConversationMember{
		Identification: iSenderID,
		Role:           iSenderRole,
	}
	iFrame := &Frame{
		SemanticProtocol: "i40:registry-semanticProtocol/onboarding",
		Type:             "publishInstance",
		MessageId:        "Sample_Msg_ID_001",
		ReplyBy:          99999999,
		Receiver:         iReceiver,
		Sender:           iSender,
		ConversationId:   "123",
	}
	interactionElements := []byte("[{\"embeddedDataSpecifications\":[],\"semanticId\":{\"keys\":[{\"idType\":\"IRI\",\"type\":\"GlobalReference\",\"value\":\"testID\",\"local\":false}]},\"kind\":\"Instance\",\"descriptions\":[],\"idShort\":\"testID\",\"identification\":{\"id\":\"testID\",\"idType\":\"IRI\"},\"modelType\":{\"name\":\"Submodel\"},\"submodelElements\":[]}]")

	// initialize test vars
	testRawJSON = []byte(strings.TrimRight(string(jsonFileContent), "\n"))
	testString = strings.TrimRight(string(jsonFileContent), "\n")
	testInteractionMessage = &InteractionMessage{
		Frame:               iFrame,
		InteractionElements: interactionElements,
	}

	fmt.Print("Tests are excuted using the following paragons:\n\n")
	fmt.Println(testRawJSON)
	fmt.Print("\n")
	fmt.Println(testString)
	fmt.Print("\n")
	fmt.Println(testInteractionMessage)
	fmt.Print("\n")
}

func TestToRawJSON(t *testing.T) {
	// test err case
	iMsg := &InteractionMessage{}
	rawJSON, err := iMsg.ToRawJSON()
	if err == nil {
		t.Errorf("failed to catch empty Frame in ToRawJSON conversion, err is %v", err)
	}

	// test positive case
	rawJSON, err = testInteractionMessage.ToRawJSON()
	if err != nil || bytes.Compare(rawJSON, testRawJSON) != 0 {
		t.Errorf("failed to convert to raw JSON, err is %v and bytes.Compare(rawJSON, testRawJSON) is %v", err, bytes.Compare(rawJSON, testRawJSON))
	}
}

func TestToString(t *testing.T) {
	// iMsg.Frame is nil
	iMsg := &InteractionMessage{}
	jsonString, err := iMsg.ToString()
	if err == nil {
		t.Errorf("failed to catch empty Frame in ToString conversion, err is %v", err)
	}

	// iMsg.InteractionElements is nil
	iMsg = &InteractionMessage{
		Frame: &Frame{},
	}
	jsonString, err = iMsg.ToString()
	if err == nil {
		t.Errorf("failed to catch empty InteractionElements in ToString conversion, err is %v", err)
	}

	// minimal positive case
	iMsg = &InteractionMessage{
		Frame:               &Frame{},
		InteractionElements: []byte("[]"),
	}
	jsonString, err = iMsg.ToString()
	if err != nil {
		t.Errorf("failed to convert to string err is %v and jsonString %q", err, jsonString)
	}

	// test positive case
	jsonString, err = testInteractionMessage.ToString()
	if err != nil || jsonString != testString {
		t.Errorf("failed to convert to string, err is %v and jsonString==testString is %v", err, jsonString == testString)
	}
}

func TestNewInteractionMessage(t *testing.T) {
	// test []byte type as arg
	iMsg, err := NewInteractionMessage(testRawJSON)
	if err != nil || iMsg == nil {
		t.Errorf("failed on NewInteractionMessage using RawJSON ([]byte), err is %v and iMsg is %v", err, iMsg)
	}

	// test string type as arg
	iMsg, err = NewInteractionMessage(testString)
	if err != nil || iMsg == nil {
		t.Errorf("failed on NewInteractionMessage using string, err is %v and iMsg is %v", err, iMsg)
	}

	// test unknown type as arg (e.g. int)
	iMsg, err = NewInteractionMessage(0)
	if err == nil {
		t.Errorf("failed on NewInteractionMessage using unknown type, err is %v", err)
	}
}

func TestFromRawJSON(t *testing.T) {
	// test error cases by selectively validating parts of an InteractionMessage

	// input is not valid JSON
	invalidString := "{"
	_, err := fromRawJSON([]byte(invalidString))
	if err == nil {
		t.Errorf("failed to catch empty input to fromRawJSON, err is %v", err)
	}

	// frame is missing
	invalidString = "{}"
	_, err = fromRawJSON([]byte(invalidString))
	if err.Error() != "rawJSON does not contain frame or frame is not an object" {
		t.Errorf("failed to catch missing frame, err is %v", err)
	}

	// frame is not an object
	invalidString = "{\"frame\":123}"
	_, err = fromRawJSON([]byte(invalidString))
	if err.Error() != "rawJSON does not contain frame or frame is not an object" {
		t.Errorf("failed to catch that frame is not an object, err is %v", err)
	}

	// frame is an object, but e.g. semanticProtocol has a wrong datatype
	invalidString = "{\"frame\":{\"semanticProtocol\":123}}"
	_, err = fromRawJSON([]byte(invalidString))
	if err == nil {
		t.Errorf("failed to catch wrong datatype within frame, err is %v", err)
	}

	// frame is ok, but interactionElements is missing
	invalidString = "{\"frame\":{\"semanticProtocol\":\"123\"}}"
	_, err = fromRawJSON([]byte(invalidString))
	if err.Error() != "rawJSON does not contain interactionElements or interactionElements is not an array" {
		t.Errorf("failed to catch missing interactionElements, err is %v", err)
	}

	// frame is ok, but interactionElements is not an array
	invalidString = "{\"frame\":{\"semanticProtocol\":123},\"interactionElements\":123}"
	_, err = fromRawJSON([]byte(invalidString))
	if err == nil {
		t.Errorf("failed to catch that interactionElements is not an array, err is %v", err)
	}

	// frame is ok, interactionElements is ok, return err is nil
	invalidString = "{\"frame\":{\"semanticProtocol\":123},\"interactionElements\":[]}"
	_, err = fromRawJSON([]byte(invalidString))
	if err == nil {
		t.Errorf("err returned is not nil, err is %v", err)
	}
}

func TestFromString(t *testing.T) {
	// error cases handled via TestFromRawJSON
}
