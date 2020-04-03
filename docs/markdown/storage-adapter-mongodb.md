# storage-adapter-mongodb

## Running

- To start: `npm run dev` from this folder
- A GET on `localhost:3100/health` returns a "Server Up!"
- A POST on `localhost:3100/submodels` with [the sample input](../../src/ts/cmd/storage-adapter-mongodb/opcua-submodel-instance.json) should result in a submodel created in the database.
- A GET on `localhost:3100/submodels` returns the list of submodels in the database.
- A DELETE on `localhost:3100/submodels/{_id}` deletes a submodel in the database.

## The big picture

![The big picture](../images/big_picture_mongodb.png 'Where this component fits in.')

## Developer notes

#### Implementation

### Integration Tests

Setup can be done with `source ./integration-test-setup`.

- To run integration tests: `npm run test-with-integration`
- To run coverage with integration tests: `npm run coverage-with-integration`
  To cleanup: `./integration-test-teardown`
