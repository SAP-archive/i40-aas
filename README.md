# i40-aas 

## Contents:  
1. [Description](#description)
1. [Requirements](#requirements)
1. [Download and Installation](#download-and-installation)
1. [Configuration](#configuration)
1. [Known Issues](#known-issues)
1. [How to obtain support](#how-to-obtain-support)
1. [Contributing](#contributing)
1. [Upcoming Changes](#upcoming-changes)
1. [License](#license)

# Description

This implementation is related to the [Plattform Industrie 4.0](https://www.plattform-i40.de/PI40/Navigation/EN/Home/home.html) activities being driven by working groups in Germany. Especially the working group [Reference Architectures, Standards, and Norms](https://www.plattform-i40.de/PI40/Navigation/EN/ThePlatform/PlatformWorkingGroups/Reference-Architectures-Standards-Norms/reference-architectures-standards-norms.html) has defined a reference architecture and a [specification](https://www.plattform-i40.de/PI40/Redaktion/EN/Downloads/Publikation/2018-details-of-the-asset-administration-shell.pdf?__blob=publicationFile&v=5) to address a challenging topic to hardware and software vendors: __interoperability__. Especially the integration of assets (devices, machines, software, documents, etc.) into business processes is always cumbersome, time-consuming, and usually costly. As shown in the following figure, this service is meant to simplify the integration processes, and has further potential to extend existing applications.


[ramisap]: docs/images/RAMI_SAP.png "Based on RAMI"

|![alt text][ramisap]|
|:--:|
| *SAP's AAS Service as Integrator and Enabler for Interoperability - representation based on RAMI* |

This service is orchestrated in containers and can be deployed anywhere, where clusters or minimal computing power can be provided, and docker containers can be composed.


# Requirements

You need to download and install [Node.js](https://nodejs.org/en/) and its packagemanager NPM.

Enter `node --version` and `npm --version` in your command line to test your installation.
You should see:

```
$ node --version
// min version: v8.12.0

$ npm --version
// min version: 6.4.1
```

You need to download and install [Docker](https://www.docker.com) to manage containers and [Docker Compose](https://docs.docker.com/compose/), which comes with Docker Desktop for Mac and Windows ([check here for Linux](https://docs.docker.com/compose/install/)).

Enter `docker --version` in your command line to test your installation.
Your should see:

```
$ docker --version
// for example: Docker version 19.03.2, build 6a30dfc

$ docker-compose version
// for example: docker-compose version 1.24.1, build 4667896b
```

Additionally, you can download and install [Postman](https://www.getpostman.com) to test the services.

# Download and Installation

Service interactions can be tested and developed locally using Docker Compose.

1. Open a terminal and go into the project folders root directory

2. Initiate the download or build of the docker images and subsequent creation of containers (can take some minutes)

```bash
## Option 1
## Use images from Docker Hub (https://hub.docker.com/orgs/sapi40/repositories)
docker-compose up

## Option 2
## Build & use images from this repository via Compose file extension
## ref.:
##  - https://docs.docker.com/compose/extends/
##  - https://docs.docker.com/compose/compose-file/#image
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

3. If you want to test the running service follow [these](docs/README_Test.md#Test) steps.

4. _CTRL+C_ stops running services in the terminal where docker-compose up has been initiated. In case this does not work, or you change some configs, run:
```
docker-compose down
```
Or kill all containers:
```bash
docker kill $(docker ps -q)
```


Refer to [this](docs/README_Minikube.md) how to run the AAS Service on a local cluster (e.g. Minikube). 

# Configuration

The local setup uses the configurations in the folder [.compose-envs/](.compose-envs/).

See [here](docs/README_Network.md) how to join service containers locally. 

We have included minimalistic instances of popular opensource services for a message broker and for database persistance in some parts. 
These can freely be replaced by any other service of your choosing or a different configuration of those same services as long as they deliver the same functionality and adhere to the internal API. 

# Known Issues

<!--- Please list all known issues, or bugs, here. Even if the project is provided "as-is" any known problems should be listed. --->

Please refer to the list of [issues](https://github.com/SAP/i40-aas/issues) on GitHub.

# How to obtain support

<!--- This section should contain details on how the outside user can obtain support, ask questions, or post a bug report on your project. If your project is provided "as-is", with no expected changes or support, you must state that here. --->

Please use the [GitHub issue tracker](https://github.com/SAP/i40-aas/issues) for any questions, bug reports, feature requests, etc.

# Contributing

<!--- Details on how external developers can contribute to your code should be posted here. You can also link to a dedicated CONTRIBUTING.md file. See further details here. --->

You are welcome to join us in our efforts to improve and increase the set of tools to realize the Asset Administration Shell for Industrie 4.0!  

Simply check the [Contribution Guidelines](CONTRIBUTING.md).

# Upcoming changes

<!--- Details on any expected changes in later versions. If your project is released "as-is", or you know of no upcoming changes, this section can be omitted. --->

This project follows the specification ["Details of the AssetAdministrationShell"](https://www.plattform-i40.de/PI40/Redaktion/EN/Downloads/Publikation/2018-details-of-the-asset-administration-shell.html) part 1 version 1.0, which is work in progress. As the specification changes, so will this project.

For upcoming changes under development, please refer to the [Github issue board](https://github.com/SAP/i40-aas/issues). 

# License

Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE file](LICENSE).

Please note that Docker images can contain other software which may be licensed under different licenses. This License file is also included in the Docker image. For any usage of built Docker images please make sure to check the licenses of the artifacts contained in the images.
