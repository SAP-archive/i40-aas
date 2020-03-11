package interaction

// Interaction struct TODO
type Interaction struct {
	Msg    *InteractionMessage
	Status *InteractionStatus
}

// Ack TODO
func (i *Interaction) Ack() {
	i.Status = &InteractionStatus{
		Code: 200,
	}
}

// Nack TODO
func (i *Interaction) Nack() {
	i.Status = &InteractionStatus{
		Code: 500,
	}
}
