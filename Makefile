BUILD_TAG ?= $(shell cat .git/refs/heads/master)

## DockerHub
REGISTRY ?= sapi40



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
	docker-compose -f docker-compose.yml up --force-recreate --renew-anon-volumes

## start everything using the docker-compose.dev.yml file
.PHONY: dev
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --force-recreate --renew-anon-volumes

## build and tag a single service image
.PHONY: build-%
build-%:
	BUILD_TAG=$(BUILD_TAG) docker-compose -f docker-compose.dev.yml build $*
	BUILD_TAG=$(BUILD_TAG) docker tag sapi40/$*:$(BUILD_TAG) $(REGISTRY)/$*:latest
	BUILD_TAG=$(BUILD_TAG) docker tag sapi40/$*:$(BUILD_TAG) $(REGISTRY)/$*:$(BUILD_TAG)

## push a single service image
.PHONY: push-%
push-%:
	BUILD_TAG=$(BUILD_TAG) docker push $(REGISTRY)/$*:$(BUILD_TAG)
	BUILD_TAG=$(BUILD_TAG) docker push $(REGISTRY)/$*:latest

## up a specific service
.PHONY: up-%
up-%:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate --renew-anon-volumes $*

## down a specific service
.PHONY: down-%
down-%:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml rm -f -s -v $*
