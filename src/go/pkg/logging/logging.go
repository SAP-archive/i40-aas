package logging

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type severityHook struct{}

func (h severityHook) Run(e *zerolog.Event, level zerolog.Level, msg string) {
	if level != zerolog.NoLevel {
		e.Str("severity", level.String())
	}
}

// SetupLogging returns a configured logger
func SetupLogging(output string, level string) (zerolog.Logger, error) {
	// default configuration
	if output == "" {
		output = "JSON"
	}
	if level == "" {
		level = "debug"
	} else {
		level = strings.ToLower(level)
	}

	// setup output configuration
	if output == "CONSOLE" {
		log.Logger = log.With().Caller().Logger()
		output := zerolog.ConsoleWriter{Out: os.Stdout, NoColor: false, TimeFormat: time.RFC3339}
		log.Logger = log.Output(output)
	} else {
		// Stackdriver specifics
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
		log.Logger = zerolog.New(os.Stdout).Hook(severityHook{}).With().Caller().Logger()
	}

	// setup log level configuration
	logLevel, err := zerolog.ParseLevel(level)
	if err != nil {
		return zerolog.New(os.Stderr), err
	}
	zerolog.SetGlobalLevel(logLevel)
	log.Debug().Msgf("log level has been set to %v", zerolog.GlobalLevel())

	return log.Logger, nil
}
