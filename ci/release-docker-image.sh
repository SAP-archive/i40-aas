#!/bin/bash

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

cp docker/$1/Dockerfile apps/$1

cd apps/$1

docker build -t "sapi40/i40-aas-"$1":latest" .

docker push "sapi40/i40-aas-"$1":latest"