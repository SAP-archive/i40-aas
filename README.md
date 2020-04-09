# i40-aas

[![Build Status](https://travis-ci.com/SAP/i40-aas.svg?branch=master)](https://travis-ci.com/SAP/i40-aas)

:warning: **i40-aas** is **alpha** :warning:

**i40-aas** welcomes [contributions](#contributing). Please read about [known issues](#known-issues) and [upcoming changes](#upcoming-changes).

## Contents

- [i40-aas](#i40-aas)
  - [Contents](#contents)
  - [Main Features](#main-features)
  - [Prerequisites](#prerequisites)
  - [Instructions](#instructions)
    - [Getting Started](#getting-started)
    - [Cleanup](#cleanup)
  - [Configuration](#configuration)
  - [Known Issues](#known-issues)
  - [Get Support](#get-support)
  - [Contributing](#contributing)
  - [Upcoming Changes](#upcoming-changes)
  - [License](#license)

## Main Features

The AAS-Service provides an implementation of the RAMI 4.0 reference architecture as specified by [Plattform Industrie 4.0](https://www.plattform-i40.de/PI40/Redaktion/DE/Downloads/Publikation/Details-of-the-Asset-Administration-Shell-Part1.html). Main features include:

- Standardized communication interfaces and API to access Asset Administration Shells of the digital representation of a physical asset (Digital Twin), that enable:

  - use of a single AAS information model
  - access to asset information from cloud and edge
  - integration of assets without a communication interface (i.e. passive), e.g. via barcodes or QR-codes pointing to asset management solutions

- Facilitate Interoperability:

  - The AAS-Service can act as a mediator between assets and applications that use different languages/standards
  - Enable interactions between administration shells based on semantic protocols [(VDI/VDE 2193-1)](https://www.vdi.de/richtlinien/details/vdivde-2193-blatt-1-sprache-fuer-i40-komponenten-struktur-von-nachrichten)
  - Information in the AAS can be exchanged between all
    partners in a value chain (e.g. system manufacturers, operators, engineering and service partners, system integrators)

- Provide registry and discovery services that:

  - hold digital models of various aspects submodels that describe the technical functionality exposed by the asset
  - implement endpoint handling for communication
  - unambiguously identify an asset in network

- Support of statefull communication patterns for well defined or proprietary interactions (see [skills](https://github.com/SAP/i40-aas/blob/master/docs/markdown/onboarding-skill.md)).

- Enable integration of applications (eg. Asset stores, datalake) through [application adapters](https://github.com/SAP/i40-aas/blob/master/docs/markdown/adapter-registry.md)

- Deploy everywhere (cloud, on-premise, edge) providing a simple developer experience with docker and K8s

[ramisap]: docs/images/RAMI_SAP.png 'Based on RAMI 4.0'

|                                         ![alt text][ramisap]                                          |
| :---------------------------------------------------------------------------------------------------: |
| _SAP's AAS Service as Integrator and Enabler for Interoperability - representation based on RAMI 4.0_ |

## Prerequisites

You need to install [Docker](https://www.docker.com) and [Docker Compose](https://docs.docker.com/compose/). Docker Compose comes with Docker if you're on Mac or Windows ([check here for Linux](https://docs.docker.com/compose/install/)). Check the installation by executing:

```bash
$ docker --version
## tested with: 19.03.8

$ docker-compose version
## tested with: 1.25.4, build 8d51620a
```

For easier usage, install Make and verify as follows:

```bash
$ make --version
## tested with: GNU Make 3.81
```

Optionally, you can download and install [Postman](https://www.getpostman.com) to [test the services](docs/markdown/test.md).

## Instructions

### Getting Started

Service interactions can be deployed, tested and developed locally using Docker Compose as described below. For further instructions & information about **i40-aas** check [the documentation](docs/README.md)

Run **i40-aas** locally using any of these options:

- Pull and run prebuilt images from our [Docker Hub repository](https://hub.docker.com/orgs/sapi40/repositories). Pulling can last several minutes depending on your internet connection.

```bash
## 'up' (start) the composed setup
$ make install
```

- Build the **i40-aas** images from source first, then pull external dependencies and continue to run everything. Builds are executed in parallel, thus build logs can appear cluttered. Building all **i40-aas** images can last several minutes.

```bash
## build i40-aas images
$ make

## 'up' (start) the composed setup
$ make install
```

### Cleanup

Once done, one can stop & clean up locally by executing:

```bash
$ make clean
```

## Configuration

The local setup uses the default configurations specified in the `.env` file.

See [here](docs/markdown/join-containers.md) how to join other service containers locally.

## Known Issues

<!--- Please list all known issues, or bugs, here. Even if the project is provided "as-is" any known problems should be listed. --->

Please refer to the list of [issues](https://github.com/SAP/i40-aas/issues) on GitHub.

## Get Support

<!--- This section should contain details on how the outside user can obtain support, ask questions, or post a bug report on your project. If your project is provided "as-is", with no expected changes or support, you must state that here. --->

Please study the [help provided](docs/README.md) and use the [GitHub issue tracker](https://github.com/SAP/i40-aas/issues) for further assistance, bug reports or feature requests.

## Contributing

<!--- Details on how external developers can contribute to your code should be posted here. You can also link to a dedicated CONTRIBUTING.md file. See further details here. --->

You are welcome to join us in our efforts to improve and increase the set of tools to realize the Asset Administration Shell for Industrie 4.0!

Simply check the [Contribution Guidelines](CONTRIBUTING.md).

## Upcoming Changes

<!--- Details on any expected changes in later versions. If your project is released "as-is", or you know of no upcoming changes, this section can be omitted. --->

This project follows the specification ["Details of the AssetAdministrationShell"](https://www.plattform-i40.de/PI40/Redaktion/EN/Downloads/Publikation/2018-details-of-the-asset-administration-shell.html) part 1 version 1.0, which is work in progress. As the specification changes, so will this project.

## License

Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE file](LICENSE).

Please note that Docker images can contain other software which may be licensed under different licenses. This License file is also included in the Docker image. For any usage of built Docker images please make sure to check the licenses of the artifacts contained in the images.
