# endpoint-registry



## PUT /AASDescriptor
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


## PATCH /AASDescriptor/{aasId}
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



## GET /AASDescriptor/{aasId}
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

## DELETE /AASDescriptor/{aasId}
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
