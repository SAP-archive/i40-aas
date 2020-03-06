package logging

import (
	"fmt"
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
func SetupLogging() zerolog.Logger {
	output := os.Getenv("LOG_OUTPUT")
	if output == "" {
		output = "CONSOLE"
	}
	level := os.Getenv("LOG_LEVEL")
	if level == "" {
		level = "DEBUG"
	}

	if output == "CONSOLE" {
		log.Logger = log.With().Caller().Logger()
		output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339}
		output.FormatMessage = func(i interface{}) string {
			return fmt.Sprintf("%s", i)
		}
		output.FormatFieldName = func(i interface{}) string {
			return fmt.Sprintf("%s:", i)
		}
		output.FormatFieldValue = func(i interface{}) string {
			return strings.ToUpper(fmt.Sprintf("%s", i))
		}

		log.Logger = log.Output(output)
	} else {
		// Stackdriver specifics
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
		log.Logger = zerolog.New(os.Stdout).Hook(severityHook{}).With().Caller().Logger()
	}

	if level == "DEBUG" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Debug().Msg("LOG_LEVEL has been set to DEBUG")
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	return log.Logger
}
