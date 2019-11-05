# Adapter-registry

A service component that offers an API for:
 - registering a storage adapter 
 - retrieving a storage adapter  
 - assigning a submodel to a storage adapter
 - retrieving the adapter(s) that can  handle a submodel


## Register 

Not yet implemented

## Read


GET /adapters
 
|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   submodelidshort   | i40-aas-objects Submodel.idshort |

response </br>
NOTE: only one adapter per submodel is assumed
```javascript
[
    {
        "url": "http://localhost:3000/submodels",
        "adapterId": "storage-adapter-ain",
        "name": "SAP-AIN-Adapter",
        "submodelId": "opc-ua-devices"
    }
]
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


## Registry basic auth

Refistry admin user is available as the following environment variables:

```
REGISTRY_ADMIN_USER 
REGISTRY_ADMIN_PASSWORD
```
