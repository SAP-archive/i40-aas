# Onboarding-skill

## Configuration

Service configuration is handled via environment variable injection. Within the `envs:` section of `docker-compose.yml` you find a full list of environment variables, some of which can be configured via the `.env` file in the repository root dir. [server.ts](src/server.ts) contains all environment variables that need to be set.

## Running

- To start: `npm run dev` from this directory

## The big picture

![The big picture](docs/big_picture.png).

## The state machine

This component uses [xstate](https://github.com/davidkpiano/xstate). The modelled state machine is shown below: ![The state machine](docs/car.png)

The machine is defined [here](src/services/onboarding/SkillStateMachineSpecification.ts).

From each state, invalid messages will be responded to (as long as they are parsable and contain a proper sender) with notUnderstood.

## Developer's note

### How it works

A message is received via the message broker (AMQPClient -> MessageInterpreter) and converted into an event, which is then passed on to the main domain class AssetRepositoryOnboardingSkill. This loads a state from persistent storage, (according to the conversation id), into the state machine and applies the event to it, writing the state back to persistent store. The transition of the state machine causes messages to be sent. This mapping is specified in SkillStateMachineSpecification.

### Tests

#### Unit Tests

- Run unit tests using `npm run test`
- Run unit tests with coverage with `npm run coverage`

#### Including integration tests

These tests require a message broker and the AMQP_URL variable set in the environment to the host name of the message broker (in the docker container) with the exposed 5672 port, for example: "localhost", if running the tests locally. The message broker for the integration needs to provide default guest user account for the tests to run.

It can be run from a docker image with `source .\integration-test-setup` (wait 20s before starting integration tests).

- To run integration tests as well: `npm run test-with-integration`
- To run coverage with integration tests: `npm run coverage-with-integration`
  To cleanup the message broker `.\integration-test-teardown`

# Writing you own "skill"

- The first thing to do is to create a state chart as above. The notation is as described in this [paper](http://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf): States are shown as rectangles with rounded edges, final states have double borders. Transistions are shown by arrows. The notation on the arrows is: event-to-move-out-of-state (condition-under-which-to-execute-transition)/transition-action-to-be-executed-while-transitioning. Actions can also be triggered on entering or exiting states. This is indicated in them being written inside the state "rectangle" in small font. Events received from other parties are concatenated as following: {message type}_FROM_{sender role} (all caps). When an external rest service is called it needs to be modelled as a [service](https://xstate.js.org/docs/guides/communication.html#the-invoke-property) with its own sub-states. Understand how the diagram maps to the [skill state machine specification](src/services/onboarding/MySkillStateMachineSpecification.ts.) provided for [xstate](https://github.com/davidkpiano/xstate). This way you create your own MySkillStateMachineSpecification.ts, replacing the one for the onboarding skill.

- Create a MySkillActionMap.ts containing the code for actions to be performed when the state machine moves through the states. These actions can be messages sent to other parties in an AAS interaction or the invocation of external services and the methods you provide here depend on your scenario. This class should make use of a MyExternalRestServiceCaller.ts to make the actual calls to the external services as well as a MyAasMessageDispatcher.ts that uses the [message sender](src/base/messaging/MessageSender.ts) to send messages via the message broker. MyAasMessageDispatcher needs to implement at least the interface [IAasMessageDispatcher](src/base/messaginginterface/IAasMessageDispatcher.ts).

  -Finally, provide a MyInitializer that provides these two communication classes and a configuration object that is later placed in the context for your state machine to use.
