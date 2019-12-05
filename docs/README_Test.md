
---
# Test
- Test using Postman
- Test from the CLI


## Test using Postman
[postman]: images/Postman_open.png "Open Postman"
[postmanimp]: images/Postman_import_collection.png "Import collection"
[postmanselend]: images/Postman_select_endpoint.png "Select Endpoint"
[postmantest]: images/Postman_test_interaction.png "Test Endpoint"


1. Open [Postman](https://www.getpostman.com)

|![alt text][postman]|
|:--:|
| *Postman* |

2. Open collection in docs folder

|![alt text][postmanimp]|
|:--:|
| *Import collection into Postman* |

3. Select Request Endpoint-Submodel

|![alt text][postmanselend]|
|:--:|
| *Select a request* |

4. Invoke Send to test the interaction

|![alt text][postmantest]|
|:--:|
| *Invoke Send to test the interaction* |

## Test from the CLI

From the directory root, execute in the CLI:
```bash
# login/pass as specified in .compose-envs/ files
curl -u admin:admin \
    --header "Content-Type: application/json" \
    --request POST \
    --data @./docs/postman/sample_requests/sample_interaction.json \
    http://localhost:2000/interaction \
    | node <<< "var o = $(cat); console.log(JSON.stringify(o, null, 4));"
```

If everything is OK, the above command should return a JSON formatted reply (as shown in Postman above).
