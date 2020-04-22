#!/bin/sh

waitfor() {
  printf "Waiting for $1:$2...\n"
  while ! nc -z $1 $2; do
    sleep 0.1
  done
  printf "netcat scan for $1:$2 successful!\n"
}

filtertarget() {
  if [ -z "${1}" ]
  then
    printf "Skipping $1 (env not set)\n"
  else
    waitfor "${1}" "${2}"
  fi
}

printf "STARTED INITIALIZATION\n"

filtertarget ${CORE_BROKER_HOST} ${CORE_BROKER_PORT} &
filtertarget ${CORE_REGISTRIES_ENDPOINTS_DATABASE_HOST} ${CORE_REGISTRIES_ENDPOINTS_DATABASE_PORT} &
filtertarget ${CORE_REGISTRIES_ENDPOINTS_HOST} ${CORE_REGISTRIES_ENDPOINTS_PORT} &
filtertarget ${CORE_DATA_MANAGER_HOST} ${CORE_DATA_MANAGER_PORT} &
## TODO: find working alternative to check mongodb
# filtertarget APPLICATION_ADAPTERS_MONGODB_HOST APPLICATION_ADAPTERS_MONGODB_PORT &
filtertarget ${CORE_REGISTRIES_ADAPTERS_HOST} ${CORE_REGISTRIES_ADAPTERS_PORT} &
filtertarget ${CORE_INGRESS_HTTP_HOST} ${CORE_INGRESS_HTTP_PORT} &
filtertarget ${CORE_INGRESS_GRPC_HOST} ${CORE_INGRESS_GRPC_PORT} &

## TODO: add endpoint-resolver, http-endpoint-egress and grpc-endpoint-egress
## once healthchecks are added

wait

printf "SERVICES ARE AVAILABLE - EXECUTING INIT SCRIPT\n"

newman run AAS.postman_collection.json \
#--delay-request 1000 \
--env-var i40-aas-endpoint-registry="${CORE_REGISTRIES_ENDPOINTS_HOST}:${CORE_REGISTRIES_ENDPOINTS_PORT}" \
--env-var i40-aas-adapter-registry="${CORE_REGISTRIES_ADAPTERS_HOST}:${CORE_REGISTRIES_ADAPTERS_PORT}" \
--env-var i40-aas-data-manager="${CORE_DATA_MANAGER_HOST}:${CORE_DATA_MANAGER_PORT}" \
--env-var i40-aas-http-endpoint-ingress="${CORE_INGRESS_HTTP_HOST}:${CORE_INGRESS_HTTP_PORT}" \
--folder "Create semantic protocols" \
--folder "Create roles" \
--folder "Create role assignments" \
--folder "Create assetadministrationshells Copy" \
--folder "Create Assignment Submodel to Application Adapter"