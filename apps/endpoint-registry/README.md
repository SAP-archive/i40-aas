# Registry

## Configuration

Service configuration is handled via environment variable injection. Within the `env_file:` section of `docker-compose.yml` you find a list of _.env_-files mounted. The corresponding default configurations and explanations are located in: `.compose-envs/<SERVICE-NAME>.env`.

## Create a SemanticProtocol

POST /semanticprotocol

```javascript
{
  "semanticProtocol":"<id of the semantic protocol>"
}
```
## Create an asset

POST /asset

```javascript
{
  "assetId":
  {
    "id":"<Asset ID>",
    "idType":"<Asset ID Type>"
  }
}
```
## Create roles

POST /roles

```javascript
[
  {
    roleId: "<id of the role>",
    semanticProtocol: "id of the semantic protocol"
  }
];
```

## Create asset administration shell, asset and endpoints for the asset administration shell

POST /assetadministrationshells

```javascript
[
  {
    aasId: {
      id: "<id of the asset administration shell>",
      idType: "URI"
    },
    endpoints: [
      {
        url: "<url of the endpoint>",
        protocolVersion: "<version of the protocol>",
        protocol: "<name of the protocol>"
      }
    ],
    assetId: {
      id: "<id of the asset>",
      idType: "URI"
    }
  }
];
```

## Read

## listAllEndpoints

GET /listallendpoints

response </br>
NOTE: returns an array of endpoints registered for each aasId

```javascript
[
  {
    aasId: {
      id: "<ID of the AAS>",
      idType: "URI,CUSTOM,IRDI"
    },
    endpoints: [
      {
        url: "https://myaas.com",
        protocolVersion: "1.0",
        protocol: "https"
      },
      {
        url: "192.168.75.12",
        protocolVersion: "",
        protocol: "TCP"
      }
    ],
    assetId: {
      id: "<ID of the Asset>",
      idType: "URI,CUSTOM,IRDI"
    }
  }
];
```

GET /assetadministrationshells

|    parameter     |            Description             |
| :--------------: | :--------------------------------: |
|     receiver     | i40-aas-objects conversationMember |
| semanticProtocol |     id of the semanticProtocol     |



response </br>
NOTE: if there are multiple aas registerd to an role then there is more then one object in the result list. </br>
If receiver.identification.id is in the receiver object, only the endpoints for this receiver is part of the response.

```javascript
[
  {
    aasId: {
      id: "<ID of the AAS>",
      idType: "URI,CUSTOM,IRDI"
    },
    endpoints: [
      {
        url: "https://myaas.com",
        protocolVersion: "1.0",
        protocol: "https"
      },
      {
        url: "192.168.75.12",
        protocolVersion: "",
        protocol: "TCP"
      }
    ],
    assetId: {
      id: "<ID of the Asset>",
      idType: "URI,CUSTOM,IRDI"
    }
  }
];
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
