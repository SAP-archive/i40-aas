#!/bin/sh

waitfor() {
  printf "Waiting for $1:$2...\n"
  while ! nc -z $1 $2; do
    sleep 0.1
  done
  printf "$1:$2 is available!\n"
}

printf "STARTED INITIALIZATION\n"

waitfor $ENDPOINT_REGISTRY_POSTGRES_HOST $ENDPOINT_REGISTRY_POSTGRES_PORT &
waitfor $RABBITMQ_AMQP_HOST $RABBITMQ_AMQP_PORT &
waitfor $MONGODB_HOST $MONGODB_PORT &
waitfor $DATA_MANAGER_HOST $DATA_MANAGER_PORT &
waitfor $ADAPTER_REGISTRY_HOST $ADAPTER_REGISTRY_PORT &
waitfor $ENDPOINT_REGISTRY_HOST $ENDPOINT_REGISTRY_PORT &
waitfor $HTTPS_ENDPOINT_INGRESS_HOST $HTTPS_ENDPOINT_INGRESS_PORT &

## TODO: Required addition once ready checks are implemented
# waitfor ONBOARDING
# waitfor EGRESS

wait

printf "SERVICES ARE AVAILABLE - EXECUTING INIT SCRIPT\n"

cd /initializer

for f in *.sh; do  # or wget-*.sh instead of *.sh
  sh "$f" -H
done
