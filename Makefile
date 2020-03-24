BUILD_TAG = $(shell cat .git/refs/heads/master)
SVC_PREFIX = sapi40/i40-aas-


.DEFAULT_GOAL := build


## build all images (in parallel) using the docker-compose.dev.yml file
## uses cache
.PHONY: build
build:
	DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 BUILD_TAG=latest docker-compose -f docker-compose.dev.yml build --parallel

## build all images (in parallel) using the docker-compose.dev.yml file
## skips cache
.PHONY: no-cache
no-cache:
	DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 BUILD_TAG=latest docker-compose -f docker-compose.dev.yml build --no-cache --parallel

## stop and remove containers & volumes related to i40-aas
.PHONY: clean
clean:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes --rmi all --remove-orphans
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml rm -v --force

## removes everything created by docker-compose and prunes everything in docker
## (!!) this includes all your work with docker, not just stuff
## related to this repository (!!)
.PHONY: purge
purge:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down --volumes --rmi all --remove-orphans
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml rm -v --force
	yes | docker system prune --all --volumes --force

## start everything using the docker-compose.yml file
.PHONY: install
install:
	docker-compose -f docker-compose.yml up --force-recreate

## start everything using the docker-compose.dev.yml file
.PHONY: dev
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --force-recreate

## Travis CI instruction (separate build & push per service)
.PHONY: build-single
build-single:
	BUILD_TAG=$(BUILD_TAG) docker-compose -f docker-compose.dev.yml build i40-aas-$(SERVICE)
	BUILD_TAG=$(BUILD_TAG) docker tag $(SVC_PREFIX)$(SERVICE):$(BUILD_TAG) $(SVC_PREFIX)$(SERVICE):latest

## Travis CI instruction (separate build & push per service)
.PHONY: push-single
push-single:
	BUILD_TAG=$(BUILD_TAG) docker push $(SVC_PREFIX)$(SERVICE):$(BUILD_TAG)
	BUILD_TAG=$(BUILD_TAG) docker push $(SVC_PREFIX)$(SERVICE):latest
