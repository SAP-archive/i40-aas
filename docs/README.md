# Help

## Contents

- [Services](#services)
  - [Overview](#overview)
  - [Architecture](#architecture)
  - [Configuration](#configuration)
- [Further Information](#further-information)
- [FAQs](#faqs)

## Services

### Overview

Each service on this full list of services included in the repository has a designated _README.md_ with more information about its purpose:

- [adapter-registry](markdown/adapter-registry.md)
- [data-manager](markdown/data-manager.md)
- [endpoint-registry](markdown/endpoint-registry.md)
- [endpoint-resolver](markdown/endpoint-resolver.md)
- [grpc-endpoint-egress](markdown/grpc-endpoint-egress.md)
- [grpc-endpoint-ingress](markdown/grpc-endpoint-ingress.md)
- [https-endpoint-egress](markdown/https-endpoint-egress.md)
- [https-endpoint-ingress](markdown/https-endpoint-ingress.md)
- [initializer](markdown/initializer.md)
- [onboarding-skill](markdown/onboarding-skill.md)
- [storage-adapter-mongodb](markdown/storage-adapter-mongodb.md)

### Architecture

The following shows the services in a [TAM](http://www.fmc-modeling.org/fmc-and-tam) block diagram.

![The big picture](images/AAS_SERVICE_REVISED.png).

### Configuration

Service configuration is handled via environment variables. In each service's `environment:` section in [docker-compose.yml](../docker-compose.yml) is a full list of environment variables used, some of which can be configured via the [.env](../.env) file in the repository root.

## Further Information

- For instructions on testing the running service look [here](markdown/test.md#Test)
- For information on running **i40-aas** in minikube look [here](markdown/minikube.md)
- For a detailed explanation of the ingress/egress message flow within **i40-aas** look [here](markdown/message-flow.md)
- For instructions on how to join your own skills/additional services to a running docker-compose setup look [here](markdown/join-containers.md)

## FAQs

### Q: Is it preferable to run i40-aas using docker-compose or Kubernetes?

A: Both work. If you have the option to do so, leverage the Helm chart to deploy **i40-aas** to Kubernetes as it allows for easier configuration, maintenance and allows to leverage monitoring/logging capabilities cloud providers.
