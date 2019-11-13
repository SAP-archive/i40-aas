# Onboarding-skill

## Running

- To start: `npm run dev` from this directory
- A GET on `localhost:3000/health` returns a "Server Up!"

## MongoDB Access

Database properties are available as the following environment variables:

```
MONGODB_HOST
MONGODB_PORT
MONGO_INITDB_ROOT_USERNAME
MONGO_INITDB_ROOT_PASSWORD
MONGO_INITDB_DATABASE
```

[server.ts](src/server.ts) contains all environment variables that need to be set.

## The big picture

![The big picture](docs/big_picture.png).

## The state machine

This component uses [xstate](https://github.com/davidkpiano/xstate). The modelled state machine is shown below: ![The state machine](docs/car.png)

The machine is defined [here](src/services/onboarding/SkillStateMachineSpecification.ts).

From each state, invalid messages will be responded to (as long as they are parsable and contain a proper sender) with notUnderstood.

## Developer notes

### Main classes:

- `AssetRepositoryOnboardingSkill`: the heart of the business logic.
- `SkillStateMachineSpecification`: the specification of the state machine from the diagram.
- `SkillActionMap`: maps actions from the state machine to calls on the MessageDispatcher (transitions result in sending of messages )
- `IMessageDispatcher/MessageDispatcher`: high-level interface for all message sending from the state machine
- `DeferredMessageDispatcher`: a message sender that allows you to collect messages with the CommandCollector) and send them with a commit action (used to avoid the state machine sending non-error messages in case the e.g. a database write error occurs after a transition has taken place)
- `WebClient`: low level HTTP messaging interface
- `AMQPClient`: low level AMQP messaging interface
- `IMessageSender/MessageSender`: high-level AMQP messaging interface
- `MessageInterpreter`: converts received AMQP messages to events to be applied to the state machine.
- `SimpleMongoDbClient/IDatabaseClient`: MongoDB interface

### How it works

A message is received via the message broker (AMQPClient -> MessageInterpreter) and converted into an event, which is then passed on to the main domain class AssetRepositoryOnboardingSkill. This loads a state from persistent storage, (according to the conversation id), into the state machine and applies the event to it, writing the state back to persistent store. The transition of the state machine causes messages to be sent. This mapping is specified in SkillStateMachineSpecification.

### Tests

#### Unit Tests

- Run unit tests using `npm run test`
- Run unit tests with coverage with `npm run coverage`

#### Including integration tests

These tests require a message broker and the AMQP_URL variable set in the environment to the host name of the message broker (in the docker container) with the exposed 5672 port, for example: "localhost", if running the tests locally. The message broker for the integration needs to provide default guest user account for the tests to run.

It can be run from a docker image with `source .\integration-test-setup`

- To run integration tests as well: `npm run test-with-integration`
- To run coverage with integration tests: `npm run coverage-with-integration`
  To cleanup the message broker `.\integration-test-teardown`

## Environment Variables

The current values can be found in folder {project root}/.compose-envs.

| Environment Variable       |                                                           Description                                                           |
| -------------------------- | :-----------------------------------------------------------------------------------------------------------------------------: |
| AMQP_URL                   |                                   The URL of the message RabbitMQ broker (without "https://")                                   |
| MONGODB_HOST               |                                                      The MongoDB host name                                                      |
| MONGODB_PORT               |                                                  The MongoDB port on the host                                                   |
| MONGO_INITDB_ROOT_USERNAME |                                           The MongoDB user name used by this service                                            |
| MONGO_INITDB_ROOT_PASSWORD |                                         The MongoDB user password used by this service                                          |
| MONGO_INITDB_DATABASE      |                                       The database used by this service to store its data                                       |
| REQUEST_APPROVAL           |            Whether to request an approval from the approver when onboarding ("true" or "false", defaults to "false)             |
| REQUEST_TYPE               | Whether to request the type from the manufacturer when onboarding (defaults to "false" -- functionaility not fully implemented) |
