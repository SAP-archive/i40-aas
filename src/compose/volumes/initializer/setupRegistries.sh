#!/bin/sh


curl --location --request PUT $CORE_REGISTRIES_ENDPOINTS_HOST:$CORE_REGISTRIES_ENDPOINTS_PORT'/AASDescriptor' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createAASDescriptors.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - AASDescriptors registered..."



curl --location --request POST $CORE_REGISTRIES_ENDPOINTS_HOST:$CORE_REGISTRIES_ENDPOINTS_PORT'/semanticProtocol' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @createSemanticProtocols.json \
-s \
-o /dev/null -w "%{http_code}\n"


echo $(date +%H:%M:%S)" - Semantic protocols created..."


curl --location --request POST $CORE_REGISTRIES_ADAPTERS_HOST:$CORE_REGISTRIES_ADAPTERS_PORT'/adapters' \
--header 'Content-Type: application/json' \
--header 'Authorization: Basic YWRtaW46YWRtaW4=' \
-d @populateStorageAdapterRegistry.json \
-s \
-o /dev/null -w "%{http_code}\n"

echo $(date +%H:%M:%S)" - Storage adapter registry populated..."

echo $(date +%H:%M:%S)" - Registries has been set up with sample data."
