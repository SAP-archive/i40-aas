FROM node:lts-alpine as builder

WORKDIR /cmd/endpoint-registry

## copy package.json first and install dependencies to leverage caching
COPY cmd/endpoint-registry/package.json /cmd/endpoint-registry
COPY cmd/endpoint-registry/yarn.lock /cmd/endpoint-registry


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
RUN yarn install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN yarn install

## add & transpile sourcecode
COPY cmd/endpoint-registry/ /cmd/endpoint-registry
RUN yarn run clean \
    && yarn run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/endpoint-registry


## aas-logger ##
COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
COPY pkg/aas-logger/package.json /pkg/aas-logger/

## copy build output from previous stage
COPY --from=builder /cmd/endpoint-registry/dist /cmd/endpoint-registry/dist
COPY --from=builder /production-dependencies/node_modules /cmd/endpoint-registry/node_modules
COPY cmd/endpoint-registry/package.json /cmd/endpoint-registry


USER aasuser
EXPOSE 4400

ENTRYPOINT [ "npm", "start" ]
