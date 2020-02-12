#!/bin/bash

waitfor() {
  printf "Waiting for $1:$2...\n"
  while ! nc -z $1 $2; do
    sleep 0.1
  done
  printf "$1:$2 is available!\n"
}

filtertarget() {
  if [ -z "${!1}" ]
  then
    printf "Skipping $1 (env not set)\n"
  else
    waitfor "${!1}" "${!2}"
  fi
}

printf "STARTED INITIALIZATION\n"

filtertarget ENDPOINT_REGISTRY_POSTGRES_HOST ENDPOINT_REGISTRY_POSTGRES_PORT &
filtertarget RABBITMQ_AMQP_HOST RABBITMQ_AMQP_PORT &
filtertarget MONGODB_HOST MONGODB_PORT &
filtertarget DATA_MANAGER_HOST DATA_MANAGER_PORT &
filtertarget ADAPTER_REGISTRY_HOST ADAPTER_REGISTRY_PORT &
filtertarget ENDPOINT_REGISTRY_HOST ENDPOINT_REGISTRY_PORT &
filtertarget HTTPS_ENDPOINT_INGRESS_HOST HTTPS_ENDPOINT_INGRESS_PORT &

## TODO: Required addition once ready checks are implemented
# filtertarget ONBOARDING
# filtertarget EGRESS

wait

printf "SERVICES ARE AVAILABLE - EXECUTING INIT SCRIPT\n"

cd /initializer

for f in *.sh; do  # or wget-*.sh instead of *.sh
  sh "$f" -H
done
