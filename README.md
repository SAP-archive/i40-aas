# i40-aas

Provide a set of tools to realize the Asset Administration Shell for Industrie 4.0.



#### Contents:  
1. [Description](#description)
1. [Requirements](#requirements)
1. [Download and Installation](#download-and-installation)
1. [Known Issues](#known-issues)
1. [How to obtain support](#how-to-obtain-support)
1. [Contributing](#contributing)
1. [Upcoming Changes](#upcoming-changes)
1. [License](#license)

## Description

<!--- Describe your project, why it exists, what it should provide to the user, and what differentiates it from any other project available. --->

*i40-aas* is a typescript implementation of the specification ["Details of the AssetAdministrationShell"](https://www.plattform-i40.de/PI40/Redaktion/EN/Downloads/Publikation/2018-details-of-the-asset-administration-shell.html) part 1 version 1.0.

It implements all required classes to build an AAS-JSON-file. It is also possible to use it in the browser as it is JavaScript.  

## Requirements

<!--- Requirements, hardware and software, that are used with your project. --->

<!--- Any external requirements must be hyperlinked to the site where that software, or that documentation, can be found. --->

You need to download and install [Node.js](https://nodejs.org/en/) and its packagemanager NPM.

Enter `node --version` and `npm --version` in your command line to test your installation.
You should see:

```
$ node --version
// min version: v8.12.0

$ npm --version
// min version: 6.4.1
```

Download and install the [TypeScriptCompiler (tsc)](https://www.npmjs.com/package/typescript).  

```
$ npm install -g typescript
```

Check your installation with `tsc --version`.
You should see:

```
$ tsc --version
// min version: 3.5.3
```


## Download and Installation

<!--- Describe, in detail, how the project should be downloaded and installed. --->

<!--- Note: This section is the most likely to fail the review cycle. Please review carefully. --->

Import *i40-aas* as a dependency in your `package.json` file of your Node.js or TypeScript project.

### 1. Create an empty Node.js project   
```
$ mkdir myaas
$ cd myaas
$ npm init
```

### 2. Prepare the TypeScript project

Create a `tsconfig.json` file in the root of the project directory and paste in the following snippet:
```
{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "dist",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "declaration": true
  },
  "include": ["src/**/*.ts", "index.ts"],
  "exclude": ["node_modules"]
}

```

### 3. Add i40-aas dependency in your package.json

Let it be added by the package manager:  
```
$ npm i --save git://github.com/SAP/i40-aas.git
```

Or add it manually to your `package.json`. (**NOTE**: You need to run `npm i` after you have edited your `package.json`.)

```
{
  "name": "testaas",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies":{
      "i40-aas": "git://github.com/SAP/i40-aas.git",
      ...
  },
  "author": "",
  "license": "ISC"
}
```

<!---
## Configuration [Optional]

*These options may not be part of the installation process, but help configure the source for specific uses.*

*This section may be omitted if there are no configuration options, or if all configuration is done and documented in the installation instructions.*

## Limitations [Optional]

*If your project has limitations that prevent it from working on certain hardware, or in certain software or configurations, please list those here.*

*If there are no known limitations, this section can be omitted.*
--->

## Known Issues

<!--- Please list all known issues, or bugs, here. Even if the project is provided "as-is" any known problems should be listed. --->

Please refer to the list of [issues](https://github.com/SAP/i40-aas/issues) on GitHub.

## How to obtain support

<!--- This section should contain details on how the outside user can obtain support, ask questions, or post a bug report on your project. If your project is provided "as-is", with no expected changes or support, you must state that here. --->

Please use the [GitHub issue tracker](https://github.com/SAP/i40-aas/issues) for any questions, bug reports, feature requests, etc.

## Contributing

<!--- Details on how external developers can contribute to your code should be posted here. You can also link to a dedicated CONTRIBUTING.md file. See further details here. --->

You are welcome to join us in our efforts to improve and increase the set of tools to realize the Asset Administration Shell for Industrie 4.0!  

Simply check the [Contribution Guidelines](https://github.com/SAP/i40-aas/blob/master/CONTRIBUTING.md).

## Upcoming changes

<!--- Details on any expected changes in later versions. If your project is released "as-is", or you know of no upcoming changes, this section can be omitted. --->

This project follows the specification ["Details of the AssetAdministrationShell"](https://www.plattform-i40.de/PI40/Redaktion/EN/Downloads/Publikation/2018-details-of-the-asset-administration-shell.html) part 1 version 1.0, which is work in progress. As the specification changes, so will this project.

For upcoming changes under development, please refer to the [Github issue board](https://github.com/SAP/i40-aas/issues). 

## License

Copyright (c) 2019 SAP SE or an SAP affiliate company. All rights reserved. This file is licensed under the Apache Software License, v. 2 except as noted otherwise in the [LICENSE file](https://github.com/SAP/i40-aas/blob/master/LICENSE).
