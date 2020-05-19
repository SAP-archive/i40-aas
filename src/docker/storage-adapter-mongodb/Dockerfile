FROM node:lts-alpine as builder

RUN apk update && apk upgrade && \
    apk add --no-cache git openssh bash postgresql postgresql-contrib netcat-openbsd

WORKDIR /cmd/storage-adapter-mongodb/

## copy package.json first and install dependencies to leverage caching
COPY cmd/storage-adapter-mongodb/package.json /cmd/storage-adapter-mongodb
COPY cmd/storage-adapter-mongodb/yarn.lock /cmd/storage-adapter-mongodb


## aas-logger ##
COPY pkg/aas-logger/package.json /pkg/aas-logger/
COPY pkg/aas-logger/yarn.lock /pkg/aas-logger/
RUN cd /pkg/aas-logger \
    && yarn install --production\
    && mkdir /aas-logger-production-dependencies/ \
    && cp -R node_modules /aas-logger-production-dependencies/ \
    && yarn install 


COPY pkg/aas-logger/ /pkg/aas-logger/

RUN cd /pkg/aas-logger \
    && yarn run clean \
    && yarn run build

## install & backup production dependencies
RUN cd /cmd/storage-adapter-mongodb \
    && yarn install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN yarn install

## add & transpile sourcecode
COPY cmd/storage-adapter-mongodb/ /cmd/storage-adapter-mongodb
RUN yarn run clean \
    && yarn run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/storage-adapter-mongodb

## aas-logger ##
COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
COPY pkg/aas-logger/package.json /pkg/aas-logger/

## copy build output from previous stage
COPY --from=builder /cmd/storage-adapter-mongodb/dist /cmd/storage-adapter-mongodb/dist
COPY --from=builder /production-dependencies/node_modules /cmd/storage-adapter-mongodb/node_modules
COPY cmd/storage-adapter-mongodb/package.json /cmd/storage-adapter-mongodb

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
