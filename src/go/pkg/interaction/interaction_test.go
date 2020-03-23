package interaction

import (
	"testing"
)

func TestNack(t *testing.T) {
	testInteraction := &Interaction{
		Status: &InteractionStatus{
			Code: 0,
		},
		Msg: &InteractionMessage{},
	}

	testInteraction.Nack()

	if testInteraction.Status.Code != 500 {
		t.Errorf("failed to Nack Interaction, testInteraction.Status.Code is %v", testInteraction.Status.Code)
	}
}

func TestAck(t *testing.T) {
	testInteraction := &Interaction{
		Status: &InteractionStatus{
			Code: 0,
		},
		Msg: &InteractionMessage{},
	}

	testInteraction.Ack()

	if testInteraction.Status.Code != 200 {
		t.Errorf("failed to Ack Interaction, testInteraction.Status.Code is %v", testInteraction.Status.Code)
	}
}
