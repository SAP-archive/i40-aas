package logging

import (
	"testing"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func TestSetupLogging(t *testing.T) {
	var err error

	// test DEBUG
	log.Logger, err = SetupLogging("JSON", "DEBUG")
	if err != nil || zerolog.GlobalLevel() != zerolog.DebugLevel {
		t.Errorf("failed to set debug level, got: %v", zerolog.GlobalLevel())
	}

	// test INFO
	log.Logger, err = SetupLogging("CONSOLE", "INFO")
	if err != nil || zerolog.GlobalLevel() != zerolog.InfoLevel {
		t.Errorf("failed to set info level, got: %v", zerolog.GlobalLevel())
	}

	// test faulty config
	log.Logger, err = SetupLogging("", "FAULTYLEVEL")
	if err == nil {
		t.Errorf("failed to detect faulty level configuration")
	}

	// test defaults
	log.Logger, err = SetupLogging("", "")
	if err != nil || zerolog.GlobalLevel() != zerolog.DebugLevel {
		t.Errorf("default level was not configured properly")
	}
}
