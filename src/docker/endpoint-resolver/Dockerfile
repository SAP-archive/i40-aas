###############################################################################
# STEP 1: Build executable binary

FROM golang:alpine as builder

# Install SSL ca certificates
RUN apk update && apk add git && apk add ca-certificates

# Create appuser
RUN adduser -D -g '' appuser

# Copy go modules from repository
COPY pkg/amqpclient /go/pkg/amqpclient
COPY pkg/interaction /go/pkg/interaction
COPY pkg/logging /go/pkg/logging

# Copy everything required to download (& cache) dependencies
COPY cmd/endpoint-resolver/go.mod /go/cmd/endpoint-resolver/go.mod
COPY cmd/endpoint-resolver/go.sum /go/cmd/endpoint-resolver/go.sum

WORKDIR /go/cmd/endpoint-resolver/

# Download dependencies
RUN go mod download

# Copy sourcecode
COPY cmd/endpoint-resolver /go/cmd/endpoint-resolver

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /go/bin/main

###############################################################################
# STEP 2: Build the image

FROM scratch as prod

# Copy SSL certificates & user from STEP 1
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd

# Copy the self-containing binary from STEP 1
COPY --from=builder /go/bin/main /go/bin/main

USER appuser

ENTRYPOINT ["/go/bin/main"]
