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

## Database Connection

Database properties are available as the following environment variables:

```
POSTGRES_HOST
POSTGRES_PORT
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
```


## Registry basic auth

Registry admin user is available as the following environment variables:

```
REGISTRY_ADMIN_USER 
REGISTRY_ADMIN_PASSWORD 
```
