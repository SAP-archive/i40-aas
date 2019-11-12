# Registry

## Configuration
Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.

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