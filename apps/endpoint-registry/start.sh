#!/bin/sh

printf "Waiting for Postgres...\n"

while ! nc -z $CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST $CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT; do
  sleep 0.1
done

printf "Postgres is available!\n"

npm run start
