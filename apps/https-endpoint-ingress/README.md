This component implements a REST API and handles requests by forwarding them to the message broker to be received from the respective skill.

# HTTPS-endpoint

API available at the server under `/api-docs`

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.

## Running

- To start: `npm run dev` from this directory
- A POST on `localhost:2000/interaction` accepts [interaction] JSON messages and forwards them to the respective broker topic.
- A GET on `localhost:2000/health` returns a "Server Up!"


## Message Routing
- The [Frame] of interaction message is read and the interaction is published to a broker topic after the following schema:
```
<semantic protocol>.<receiver.role.name>.<msg-type>
```
Note: the "." characters in any of the above components will be replace with a "-". For example, a message of type "publishInstance" inteded for the SAP_CentralAssetRepository Skill based on the onboarding protocol will be published in the following channel
```
"40:registry-semanticProtocol/onboarding.CentralAssetRepository.publishInstance";
```
i40:registry-semanticProtocol-onboarding:CentralAssetRepository:publishInstance

### Error handling
Each type of error has to be addressed. That includes:

- Catch uncaughtException and unhandledRejection.
- Distinguish client errors vs server errors.
- Catch both sync and async errors, without overloading the controllers’ code with error handling. The idea is to throw an exception and make sure the dedicated middleware will handle it for us.
- Create a dedicated ErrorHandler class that can be used also for unit-testing.

The handling of client and server errors is done through the errorHandlers.ts middleware class.three A different errorhandler is used for each case:
- handle404Error adds a fallback middleware if no other handler was found
- handleClientErrors catches client API errors like Bad request or Unauthorized. Only in 4xx HTTP errors are relevan, otherwise they are propagated down the chain
- handleServerErrors offers a place where cases such as “Internal Server Error” can be handled. This is a last resort for handling errors. Whatever is not handled here, an uncaughtException handler will be called, and this node process will be finished.

The ErrorHandler.ts file extracts the error handling logic from the the express middleware. This allows for unit-testing and replacing the error handling strategy.


### Testing:
Technologies:
- [Mocha](https://mochajs.org/) :  Testing Framework
- [Chai](https://www.chaijs.com/): assersion library
- [Sinon](https://sinon.org/): Standalone test spies, stubs and mocks
- [Axios](https://github.com/axios/axios): Promise based HTTP client

#### Unit Tests
- Run unit tests using `npm run test`
- Run unit tests with coverage with `npm run coverage`
