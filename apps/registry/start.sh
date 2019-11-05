#!/bin/sh

printf "Waiting for Postgres...\n"

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do   
  sleep 0.1 
done

printf "Postgres is available!\n"

npm run start