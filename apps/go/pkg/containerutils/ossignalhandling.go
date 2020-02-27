package containerutils

import (
	"os"
	"os/signal"
	"syscall"
)

// WaitForShutdown TODO
func WaitForShutdown() {
	interruptChan := make(chan os.Signal, 1)
	signal.Notify(interruptChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	// Block until we receive our signal.
	<-interruptChan
}
