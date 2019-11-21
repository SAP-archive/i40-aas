# Adapter-registry

A service component that offers an API for:
 - registering a storage adapter
 - retrieving a storage adapter
 - assigning a submodel to a storage adapter
 - retrieving the adapter(s) that can  handle a submodel

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.


## Register

POST /register

```javascript
[
    {
        "adapter": {
          "adapterId":"fooAdapterId",
          "url":"fooURL",
          "name":"testAdaptername",
        "submodelId": "opc-ua-devices"
        },
         "submodel": {
      "submodelIdShort": "opc-ua-devices"
      }
    }
]
```



## Read


GET /adapters

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   submodelidshort   | i40-aas-objects Submodel.idshort |

response </br>
NOTE: only one adapter per submodel is assumed
```javascript
    {
        "url": "http://localhost:3000/submodels",
        "adapterId": "storage-adapter-ain",
        "name": "SAP-AIN-Adapter",
        "submodelId": "opc-ua-devices"
    }
```

error
```javascript
{
  r_statusCode:<error code>
}
```

## Database Connection

Not yet implemented

[node-persist](https://www.npmjs.com/package/node-persist) as Local storage is used
