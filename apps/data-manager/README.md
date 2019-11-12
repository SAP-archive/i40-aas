The data manager acts as a router that forwards requests to the responsible storage adapter services.

# Data-manager

API available at the server under `/api-docs`

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.

## Running

- To start: `npm run dev` from the this directory
- A GET on `localhost:4000/health` returns a "Server Up!"


### Testing:
Technologies:
- [Mocha](https://mochajs.org/) : Testing Framework
- [Chai](https://www.chaijs.com/): Assertion library
- [Nock](https://github.com/nock/nock) : Mocking External HTTP Requests in Node Tests 