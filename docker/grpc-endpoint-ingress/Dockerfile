###############################################################################
# STEP 1: Build executable binary

FROM golang:alpine as builder

# Install SSL ca certificates
RUN apk update && apk add git && apk add ca-certificates

# Create appuser
RUN adduser -D -g '' appuser

COPY grpc-endpoint-ingress /grpc-endpoint-ingress/
COPY go /go
COPY proto /proto
WORKDIR /grpc-endpoint-ingress/

# Download dependencies
RUN go get -d -v

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /go/bin/main

###############################################################################
# STEP 2: Build the image

FROM scratch

# Copy SSL certificates & user from STEP 1
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /etc/passwd /etc/passwd

# Copy the self-containing binary from STEP 1
COPY --from=builder /go/bin/main /go/bin/main

USER appuser
EXPOSE 8384

ENTRYPOINT ["/go/bin/main"]
