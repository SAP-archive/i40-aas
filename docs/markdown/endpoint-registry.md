# endpoint-registry



## PUT /AASDescriptors
### Registers a new Asset Administration Shell

```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "asset": {
    "id": "string",
    "idType": "Custom"
  },
  "descriptor": {
    "endpoints": [
      {
        "address": "string",
        "type": "string"
      }
    ],
    "certificate_x509_i40": "string",
    "signature": "string"
  }
}
```
**Success Response:**
The Asset Administration Shell was registered successfully
  * **Code:** 201 <br />
    **Content:** `Same as Request Body`

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 422 <br />
    **Description:** `The passed Asset Administration Shell conflicts with already registered Asset Administration Shells`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`


## PATCH /AASDescriptors/{aasId}
### Renews a specific Asset Administration Shell's registration


|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   aasId:string (required)  |  The Asset Administration Shell's unique id      |

**Request Body**

```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "asset": {
    "id": "string",
    "idType": "Custom"
  },
  "descriptor": {
    "endpoints": [
      {
        "address": "string",
        "type": "string"
      }
    ],
    "certificate_x509_i40": "string",
    "signature": "string"
  }
}
```


**Success Response:**
The Asset Administration Shell was updated successfully
  * **Code:** 200 <br />
    **Content:**
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "asset": {
    "id": "string",
    "idType": "Custom"
  },
  "descriptor": {
    "endpoints": [
      {
        "address": "string",
        "type": "string"
      }
    ],
    "certificate_x509_i40": "string",
    "signature": "string"
  }
}
```

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 400 <br />
    **Description:** `Bad Request`
  * **Code:** 404 <br />
    **Description:** `No Asset Administration Shell with passed id found`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`



## GET /AASDescriptors/{aasId}
### Retrieves one defined, registered Asset Administration Shells within a defined system (e.g. site, area, production line, station)

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   aasId:string (required)  |  The Asset Administration Shell's unique id      |



**Success Response:**
The Asset Administration Shell was read successfully
  * **Code:** 200 <br />
    **Content:**
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "asset": {
    "id": "string",
    "idType": "Custom"
  },
  "descriptor": {
    "endpoints": [
      {
        "address": "string",
        "type": "string"
      }
    ],
    "certificate_x509_i40": "string",
    "signature": "string"
  }
}
```

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 400 <br />
    **Description:** `Bad Request`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`

## DELETE /AASDescriptors/{aasId}
### Unregisters a specific Asset Administration Shell


|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   aasId:string (required)  |  The Asset Administration Shell's unique id      |



**Success Response:**
The Asset Administration Shell was unregistered successfully  * **Code:** 202 <br />
    **Content:**
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "asset": {
    "id": "string",
    "idType": "Custom"
  },
  "descriptor": {
    "endpoints": [
      {
        "address": "string",
        "type": "string"
      }
    ],
    "certificate_x509_i40": "string",
    "signature": "string"
  }
}
```

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 400 <br />
    **Description:** `Bad Request`
  * **Code:** 404 <br />
    **Description:** `No Asset Administration Shell with passed id found`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`



## PUT /semanticProtocols
### Create a new semanticProtocol
Body:
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "roles": [
    {
      "name": "string",
      "aasDescriptorIds": [
        {
          "id": "string",
          "idType": "Custom"
        }
      ]
    }
  ]
}
```
**Success Response:**
The SemanticProtocol was registered successfully
  * **Code:** 201 <br />
    **Content:** `Same as Request Body`

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 422 <br />
    **Description:** `The passed SemanticProtocol conflicts with already registered Asset Administration Shells`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`


## GET /semanticProtocols/{sematicProtocolId}
### Retrieves one defined, registered SemanticProtocol

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   sematicProtocolId:string (required)  |  The SemanticProtocol's unique id      |



**Success Response:**
The SemanticProtocol was read successfully
  * **Code:** 200 <br />
    **Content:**
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "roles": [
    {
      "name": "string",
      "aasDescriptorIds": [
        {
          "id": "string",
          "idType": "Custom"
        }
      ]
    }
  ]
}
```

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 400 <br />
    **Description:** `Bad Request`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`



## PATCH /semanticProtocols/{sematicProtocolId}
### Updates one defined, registered SemanticProtocol

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   sematicProtocolId:string (required)  |  The SemanticProtocol's unique id      |

Body:
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "roles": [
    {
      "name": "string",
      "aasDescriptorIds": [
        {
          "id": "string",
          "idType": "Custom"
        }
      ]
    }
  ]
}
```
**Success Response:**
The SemanticProtocol was updated successfully
  * **Code:** 200 <br />
    **Content:**
```javascript
Same as body
```

## DELETE /semanticProtocols/{sematicProtocolId}
### Deletes one defined, registered SemanticProtocol

|   parameter         |      Description                 |
|   :-------:         | :-------------------:            |
|   sematicProtocolId:string (required)  |  The SemanticProtocol's unique id      |

**Success Response:**
The SemanticProtocol was deleted successfully
  * **Code:** 200 <br />
    **Content:**
```javascript
{
  "identification": {
    "id": "string",
    "idType": "Custom"
  },
  "roles": [
    {
      "name": "string",
      "aasDescriptorIds": [
        {
          "id": "string",
          "idType": "Custom"
        }
      ]
    }
  ]
}
```



## GET /semanticProtocols/{sematicProtocolId}/role/{roleName}/AASDescriptors
### Retrieve all AASDescriptors by semanticProtocol and role

**Success Response:**
The SemanticProtocol was registered successfully
  * **Code:** 201 <br />
    **Content:**
```javascript
[
  {
    "identification": {
      "id": "string",
      "idType": "Custom"
    },
    "asset": {
      "id": "string",
      "idType": "Custom"
    },
    "descriptor": {
      "endpoints": [
        {
          "address": "string",
          "type": "string"
        }
      ],
      "certificate_x509_i40": "string",
      "signature": "string"
    }
  }
]
```

**Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
  * **Code:** 422 <br />
    **Description:** `The Role given does not exist in registry`
  * **Code:** 502 <br />
    **Description:** `Bad Gateway`


