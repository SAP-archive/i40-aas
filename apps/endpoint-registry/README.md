# Registry

## Register 

POST /register

```javascript
 {
  aasId: {
    id: '<ID of the AAS>',
    idType: 'URI,CUSTOM,IRDI'
  },
  endpoints: [
    {
      url: 'https://myaas.com',
      protocolVersion: '1.0',
      protocol: 'https'
    },
    {
      url: '192.168.75.12',
      protocolVersion: '',
      protocol: 'TCP'
    }
  ],
  assetId: {
    id: '<ID of the Asset>',
    idType: 'URI,CUSTOM,IRDI'
  }
}
```

## Read

GET /read
 
| parameter |             Description             |
| :-------: | :---------------------------------: |
|    id     |            ID of the AAS            |
|  idType   | IDType of the AAS default is Custom |

GET /endpoints
 
| parameter |      Description      |
| :-------: | :-------------------: |
|   frame   | i40-aas-objects frame |

response </br>
NOTE: if there are multiple aas registerd to an role then there is more then one object in the result list.  </br>
If receiver.identification.id is in the frame, only the endpoints for this receiver is part of the response. 
```javascript
[{
  aasId: {
    id: '<ID of the AAS>',
    idType: 'URI,CUSTOM,IRDI'
  },
  endpoints: [
    {
      url: 'https://myaas.com',
      protocolVersion: '1.0',
      protocol: 'https'
    },
    {
      url: '192.168.75.12',
      protocolVersion: '',
      protocol: 'TCP'
    }
  ],
  assetId: {
    id: '<ID of the Asset>',
    idType: 'URI,CUSTOM,IRDI'
  }
}]
```

error
```javascript
{
  r_statusCode:<error code>
}
```

Create Database 

1. create Database
2. create assets table 
3. create asset_administration_shells table
4. create endpoints table 


## Environment Variables

Basic Auth (self-owned):
```
- REGISTRY_ADMIN_USER (should be renamed to ENDPOINT-REGISTRY-USER)
- REGISTRY_ADMIN_PASSWORD (should be renamed to ENDPOINT-REGISTRY-PASS)
```


Exposed Endpoints (self-owned)
```
- ENDPOINT_REGISTRY_BASE_URL : URL of Endpoint-registry (without the /endpoint suffix)
- ENDPOINT_REGISTRY_BASE_URL_GET_ENDPOINTS_SUFFIX: (the endpoint-registry endpoint to GET the AAS endpoints) (NOTE: should be set to "/endpoints")
```

Database connection (self-owned):

```
- POSTGRES_HOST ('ENDPOINT_REGISTRY_' prefix should be added to all) 
- POSTGRES_PORT
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
```
