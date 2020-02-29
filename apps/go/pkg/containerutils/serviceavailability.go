package containerutils

import (
	"net"
	"sync"
	"time"

	"github.com/jpillora/backoff"
	"github.com/rs/zerolog/log"
)

// WaitForServices tests and waits on the availability of a TCP host and port
// based on: https://github.com/alioygur/wait-for/blob/master/main.go
func WaitForServices(services []string, timeOut time.Duration) {
	var depChan = make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(len(services))
	go func() {
		for _, s := range services {
			go func(s string) {
				defer wg.Done()
				b := backoff.Backoff{
					Min:    1 * time.Second,
					Max:    5 * time.Second,
					Factor: 2,
					Jitter: false,
				}
				for {
					_, err := net.Dial("tcp", s)
					if err != nil {
						d := b.Duration()
						log.Error().Err(err).Msgf("failed tcp dial for %s, retrying in %s...", s, d)
						time.Sleep(d)
					} else {
						log.Debug().Msgf("tcp dial for %s successful", s)
						return
					}

				}
			}(s)
		}
		wg.Wait()
		close(depChan)
	}()

	select {
	case <-depChan: // services are ready
		log.Info().Msg("services are ready")
	case <-time.After(timeOut):
		log.Error().Msgf("services aren't ready in %s", timeOut)
	}
}
