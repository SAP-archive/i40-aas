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

// colorize returns the string s wrapped in ANSI code c, unless disabled is true.
func colorize(s interface{}, c int, disabled bool) string {
	if disabled {
		return fmt.Sprintf("%s", s)
	}
	return fmt.Sprintf("\x1b[%dm%v\x1b[0m", c, s)
}

func myFormatLevel(noColor bool) zerolog.Formatter {
	return func(i interface{}) string {
		var l string
		if ll, ok := i.(string); ok {
			switch ll {
			// color codes https://github.com/Marak/colors.js/blob/master/lib/styles.js
			case "debug":
				l = colorize("DBG", 34, noColor)
			case "info":
				l = colorize("INF", 32, noColor)
			case "warn":
				l = colorize("WRN", 33, noColor)
			case "error":
				l = colorize(colorize("ERR", 31, noColor), 1, noColor)
			case "fatal":
				l = colorize(colorize("FTL", 31, noColor), 1, noColor)
			case "panic":
				l = colorize(colorize("PNC", 31, noColor), 1, noColor)
			default:
				l = colorize("???", 1, noColor)
			}
		} else {
			if i == nil {
				l = colorize("???", 1, noColor)
			} else {
				l = strings.ToUpper(fmt.Sprintf("%s", i))[0:3]
			}
		}
		return l
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

		output := zerolog.ConsoleWriter{
			Out:         os.Stdout,
			NoColor:     false,
			TimeFormat:  time.RFC3339,
			FormatLevel: myFormatLevel(false),
		}

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
