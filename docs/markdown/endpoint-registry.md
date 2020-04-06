# endpoint-registry

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
    roleId: '<id of the role>',
    semanticProtocol: 'id of the semantic protocol'
  }
];
```

## Create asset administration shell, asset and endpoints for the asset administration shell

POST /assetadministrationshells

```javascript
[
  {
    aasId: {
      id: '<id of the asset administration shell>',
      idType: 'URI|CUSTOM|IRDI'
    },
    endpoints: [
      {
        url: '<url of the endpoint>',
        protocolVersion: '<version of the protocol>',
        protocol: '<name of the protocol>',
        target: '<cloud|edge>'
      }
    ],
    assetId: {
      id: '<id of the asset>',
      idType: 'URI|CUSTOM|IRDI'
    }
  }
];
```

## Create role assignments

```javascript
[
  {
    aasId: {
      id: '<ID of the AAS>',
      idType: 'URI|CUSTOM|IRDI'
    },
    roleId: '<id of the role>'
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
        target: "edge"
      },
      {
        url: "192.168.75.12",
        protocolVersion: "",
        protocol: "TCP",
        target: "cloud"
      }
    ],
    assetId: {
      id: "<ID of the Asset>",
      idType: "<URI|CUSTOM|IRDI>"
    }
  }
];
```

GET /assetadministrationshells

There are two different queries possible with each two parameters:

|    parameter     |                   Description                   |
| :--------------: | :---------------------------------------------: |
|   receiverRole   | role of receving party within semantic protocol |
| semanticProtocol |           id of the semanticProtocol            |

|   parameter    |                  Description                  |
| :------------: | :-------------------------------------------: |
|   receiverId   | id of receving party within semantic protocol |
| receiverIdType |            type of id (e.g. "IRI")            |

response </br>
NOTE: if there are multiple aas registerd to an role then there is more then one object in the result list. </br>
If receiver.identification.id is in the receiver object, only the endpoints for this receiver is part of the response.

```javascript
[
  {
    aasId: {
      id: '<ID of the AAS>',
      idType: 'URI,CUSTOM,IRDI'
    },
    endpoints: [
      {
        url: 'https://myaas.com',
        protocolVersion: '1.0',
        protocol: 'https',
        target: 'edge'
      },
      {
        url: '192.168.75.12',
        protocolVersion: '',
        protocol: 'TCP',
        target: 'cloud'
      }
    ],
    assetId: {
      id: '<ID of the Asset>',
      idType: 'URI,CUSTOM,IRDI'
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

## Developer's notes

### Tests

#### Unit Tests

- Run unit tests using `npm run test`
- Run unit tests with coverage with `npm run coverage`

#### Including integration tests

Test setup can be done with `source ./integration-test-setup`.

- To run integration tests as well as unit tests: `npm run test-with-integration`
- To run coverage with integration tests: `npm run coverage-with-integration`

Test cleanup: `./integration-test-teardown`
