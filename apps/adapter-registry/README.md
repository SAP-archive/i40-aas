# Adapter-registry

A service component that offers an API for:
 - registering a storage adapter
 - retrieving a storage adapter
 - assigning a submodel to a storage adapter
 - retrieving the adapter(s) that can  handle a submodel

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.


## Adapters
Create an Adapter in the Registry


POST /adapters

```javascript
[
    {
          "adapterId":"fooAdapterId",
          "url":"fooURL",
          "name":"testAdaptername",
          "submodelid": "opc-ua-devices",
          "submodelsemanticid" : "part-100-device-information-model"
    }
]
```

## Read


GET /adapters

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   submodelid        |  Submodel.identification.id      |

OR

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|  submodelsemanticid |  Submodel.semanticId.value[0]    |


response </br>
NOTE: only one adapter per submodel is assumed
```javascript
    {
    "adapterId":"fooAdapterId",
    "url":"fooURL",
    "name":"testAdaptername",
    "submodelid": "opc-ua-devices",
    "submodelsemanticid" : "part-100-device-information-model"
    }
```

## Delete All Adapters


DELETE /deleteall


response </br>
NOTE: only one adapter per submodel is assumed
```javascript
    {
    "Registry Cleared"
    }
```


## Persistency

[node-persist](https://www.npmjs.com/package/node-persist) as Local storage is used
