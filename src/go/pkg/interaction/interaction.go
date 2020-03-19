package interaction

// Interaction bundles an InteractionStatus for an InteractionMessage
type Interaction struct {
	Msg    *InteractionMessage
	Status *InteractionStatus
}

// Ack the InteractionMessage
func (i *Interaction) Ack() {
	i.Status = &InteractionStatus{
		Code: 200,
	}
}

// Nack the InteractionMessage
func (i *Interaction) Nack() {
	i.Status = &InteractionStatus{
		Code: 500,
	}
}
