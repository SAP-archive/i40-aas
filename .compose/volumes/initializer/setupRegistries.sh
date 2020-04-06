#!/bin/sh
curl --location --request POST $ENDPOINT_REGISTRY_HOST:$ENDPOINT_REGISTRY_PORT'/semanticprotocol' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createSemanticProtocols.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Semantic protocols created..."


curl --location --request POST $ENDPOINT_REGISTRY_HOST:$ENDPOINT_REGISTRY_PORT'/roles' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createRoles.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Roles created..."



curl --location --request POST $ENDPOINT_REGISTRY_HOST:$ENDPOINT_REGISTRY_PORT'/assetadministrationshells' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @registerEndpoints.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Endpoints registered..."


curl --location --request POST $ENDPOINT_REGISTRY_HOST:$ENDPOINT_REGISTRY_PORT'/roleassignment' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createRoleAssignments.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Role assignments created..."


curl --location --request POST $ADAPTER_REGISTRY_HOST:$ADAPTER_REGISTRY_PORT'/adapters' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @populateStorageAdapterRegistry.json \
-s \
-o /dev/null -w "%{http_code}\n"

echo $(date +%H:%M:%S)" - Storage adapter registry populated..."

echo $(date +%H:%M:%S)" - Registries has been set up with sample data."
