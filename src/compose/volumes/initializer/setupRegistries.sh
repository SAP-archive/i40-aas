#!/bin/sh
curl --location --request POST $CORE_REGISTRIES_ENDPOINTS_HOST:$CORE_REGISTRIES_ENDPOINTS_PORT'/semanticprotocol' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createSemanticProtocols.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Semantic protocols created..."


curl --location --request POST $CORE_REGISTRIES_ENDPOINTS_HOST:$CORE_REGISTRIES_ENDPOINTS_PORT'/roles' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createRoles.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Roles created..."



curl --location --request POST $CORE_REGISTRIES_ENDPOINTS_HOST:$CORE_REGISTRIES_ENDPOINTS_PORT'/assetadministrationshells' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @registerEndpoints.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Endpoints registered..."


curl --location --request POST $CORE_REGISTRIES_ENDPOINTS_HOST:$CORE_REGISTRIES_ENDPOINTS_PORT'/roleassignment' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createRoleAssignments.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Role assignments created..."


curl --location --request POST $CORE_REGISTRIES_ADAPTERS_HOST:$CORE_REGISTRIES_ADAPTERS_PORT'/adapters' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @populateStorageAdapterRegistry.json \
-s \
-o /dev/null -w "%{http_code}\n"

echo $(date +%H:%M:%S)" - Storage adapter registry populated..."

echo $(date +%H:%M:%S)" - Registries has been set up with sample data."
