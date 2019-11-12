# Storage-adapter-mongodb

## MongoDB Access

Database properties are available as the following environment variables:

```
MONGODB_HOST
MONGODB_PORT
MONGO_INITDB_ROOT_USERNAME
MONGO_INITDB_ROOT_PASSWORD
MONGO_INITDB_DATABASE
```

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

## Environment Variables

The current values can be found in folder {project root}/.compose-envs.

| Environment Variable       |                     Description                     |
| -------------------------- | :-------------------------------------------------: |
| MONGODB_HOST               |                The MongoDB host name                |
| MONGODB_PORT               |            The MongoDB port on the host             |
| MONGO_INITDB_ROOT_USERNAME |     The MongoDB user name used by this service      |
| MONGO_INITDB_ROOT_PASSWORD |   The MongoDB user password used by this service    |
| MONGO_INITDB_DATABASE      | The database used by this service to store its data |
