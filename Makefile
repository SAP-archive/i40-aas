TAG = $(shell cat .git/refs/heads/master)
SVC_PREFIX = sapi40/i40-aas-

.PHONY: build
.PHONY: no-cache
.PHONY: clean
.PHONY: up
.PHONY: dev
.PHONY: build-single
.PHONY: push-single

.DEFAULT_GOAL := build

## build all images (in parallel) using the docker-compose.dev.yml file
## uses cache
build:
	TAG=latest docker-compose -f docker-compose.dev.yml build --parallel

## build all images (in parallel) using the docker-compose.dev.yml file
## skips cache
no-cache:
	TAG=latest docker-compose -f docker-compose.dev.yml build --no-cache --parallel

## removes everything created by docker-compose and prunes everything in docker
## (!!) this includes all your work with docker, not just stuff
## related to this repository (!!)
clean:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes --rmi all --remove-orphans
	yes | docker system prune --all --volumes --force

## start everything using the docker-compose.yml file
up:
	docker-compose -f docker-compose.yml up

## start everything using the docker-compose.dev.yml file
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --force-recreate

## Travis CI instruction (separate build & push per service)
build-single:
	TAG=$(TAG) docker-compose -f docker-compose.dev.yml build i40-aas-$(SERVICE)
	TAG=$(TAG) docker tag $(SVC_PREFIX)$(SERVICE):$(TAG) $(SVC_PREFIX)$(SERVICE):latest

## Travis CI instruction (separate build & push per service)
push-single:
	TAG=$(TAG) docker push $(SVC_PREFIX)$(SERVICE):$(TAG)
	TAG=$(TAG) docker push $(SVC_PREFIX)$(SERVICE):latest
