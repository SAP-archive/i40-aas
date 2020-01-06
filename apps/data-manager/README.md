The data manager acts as a router that forwards requests to the responsible storage adapter services.

# Data-manager

API available at the server under `/api-docs`


## Submodels
Route a submodel to its respective adapter


POST /submodels

```javascript
[
   {
    "embeddedDataSpecifications": [],
    "semanticId": {
      "keys": [
        {
          "idType": "URI",
          "type": "GlobalReference",
          "value": "opcfoundation.org/specifications-unified-architecture/part-100-device-information-model/",
          "local": false
        }
      ]
    },
    "kind": "Instance",
    "descriptions": [],
    "idShort": "opc-ua-devices",
    "identification": {
      "id": "sap.com/aas/submodels/part-100-device-information-model/10JF-1234-Jf14-PP22",
      "idType": "URI"
    },
    "modelType": {
      "name": "Submodel"
    },
    "submodelElements": [
      { .....}
   }
]
```


GET /submodels

Retrieve a submodel from its adapter

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   submodelid        |  Submodel.identification.id      |

OR

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|  submodelSemanticId |  Submodel.semanticId.value[0]    |







## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.

## Running

- To start: `npm run dev` from the this directory
- A GET on `localhost:4000/health` returns a "Server Up!"


### Testing:

To run tests give:
`npm run test`

Technologies:
- [Mocha](https://mochajs.org/): Testing Framework
- [Chai](https://www.chaijs.com/): Assertion library
- [Nock](https://github.com/nock/nock): Mocking External HTTP Requests in Node Tests
