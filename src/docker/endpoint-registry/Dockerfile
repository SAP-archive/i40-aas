FROM node:lts-alpine as builder

WORKDIR /cmd/endpoint-registry

## copy package.json first and install dependencies to leverage caching
COPY cmd/endpoint-registry/package.json /cmd/endpoint-registry

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/endpoint-registry/ /cmd/endpoint-registry
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN apk update && apk upgrade \
    && apk add --no-cache bash postgresql postgresql-contrib netcat-openbsd

RUN adduser -D aasuser

WORKDIR /cmd/endpoint-registry

## copy build output from previous stage
COPY --from=builder /cmd/endpoint-registry/dist /cmd/endpoint-registry/dist
COPY --from=builder /production-dependencies/node_modules /cmd/endpoint-registry/node_modules
COPY cmd/endpoint-registry/package.json /cmd/endpoint-registry

COPY cmd/endpoint-registry/start.sh /cmd/endpoint-registry
COPY cmd/endpoint-registry/prepareDB.sh /cmd/endpoint-registry
COPY cmd/endpoint-registry/sql/* /cmd/endpoint-registry/sql/

USER aasuser
EXPOSE 4400

ENTRYPOINT [ "./start.sh" ]
