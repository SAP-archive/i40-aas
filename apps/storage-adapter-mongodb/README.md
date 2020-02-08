# Storage-adapter-mongodb

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.

## Running

- To start: `npm run dev` from this folder
- A GET on `localhost:3100/health` returns a "Server Up!"
- A POST on `localhost:3100/submodels` with [the sample input](./opcua-submodel-instance.json) should result in a submodel created in the database.
- A GET on `localhost:3100/submodels` returns the list of submodels in the database.
- A DELETE on `localhost:3100/submodels/{_id}` deletes a submodel in the database.

## The big picture

![The big picture](docs/big_picture.png "Where this component fits in.")

## Developer notes

#### Implementation

### Unit Tests

- Run unit tests using `npm run test`
- Run unit tests with coverage with `npm run coverage`
