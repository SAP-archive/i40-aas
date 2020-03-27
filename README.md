# i40-aas

[![Build Status](https://travis-ci.com/SAP/i40-aas.svg?branch=master)](https://travis-ci.com/SAP/i40-aas)

:warning: __i40-aas__ is __alpha__ :warning:

__i40-aas__ welcomes [contributions](#contributing). Please read about [known issues](#known-issues) and [upcoming changes](#upcoming-changes).



## Contents
- [Description](#description)
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



## Description
This implementation is related to the [Plattform Industrie 4.0](https://www.plattform-i40.de/PI40/Navigation/EN/Home/home.html) activities being driven by working groups in Germany. Especially the working group [Reference Architectures, Standards, and Norms](https://www.plattform-i40.de/PI40/Navigation/EN/ThePlatform/PlatformWorkingGroups/Reference-Architectures-Standards-Norms/reference-architectures-standards-norms.html) has defined a reference architecture and a [specification](https://www.plattform-i40.de/PI40/Redaktion/EN/Downloads/Publikation/2018-details-of-the-asset-administration-shell.pdf?__blob=publicationFile&v=5) to address a challenging topic to hardware and software vendors: __interoperability__. Especially the integration of assets (devices, machines, software, documents, etc.) into business processes is always cumbersome, time-consuming, and usually costly. As shown in the following figure, this service is meant to simplify the integration processes, and has further potential to extend existing applications.


[ramisap]: docs/images/RAMI_SAP.png "Based on RAMI 4.0"

|![alt text][ramisap]|
|:--:|
| *SAP's AAS Service as Integrator and Enabler for Interoperability - representation based on RAMI 4.0* |

This service is orchestrated in containers and can be deployed anywhere, where clusters or minimal computing power can be provided, and docker containers can be composed.



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
Service interactions can be deployed, tested and developed locally using Docker Compose as described below. For further instructions & information about __i40-aas__ check [the documentation](docs/README.md)

Run __i40-aas__ locally using any of these options:
- Pull and run prebuilt images from our [Docker Hub repository](https://hub.docker.com/orgs/sapi40/repositories). Pulling can last several minutes depending on your internet connection.
```bash
## 'up' (start) the composed setup
$ make install
```

- Build the __i40-aas__ images from source first, then pull external dependencies and continue to run everything. Builds are executed in parallel, thus build logs can appear cluttered. Building all __i40-aas__ images can last several minutes.
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
