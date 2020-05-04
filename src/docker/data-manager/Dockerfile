FROM node:lts-alpine AS builder

WORKDIR /cmd/data-manager

## copy package.json first and install dependencies to leverage caching
COPY cmd/data-manager/package.json /cmd/data-manager
COPY cmd/data-manager/yarn.lock /cmd/data-manager

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
RUN cd /cmd/data-manager \
    && yarn install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN yarn install

## add & transpile sourcecode
COPY cmd/data-manager/ /cmd/data-manager
RUN yarn run clean \
    && yarn run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/data-manager

## aas-logger ##
COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
COPY pkg/aas-logger/package.json /pkg/aas-logger/

## copy build output from previous stage
COPY --from=builder /cmd/data-manager/dist /cmd/data-manager/dist
COPY --from=builder /production-dependencies/node_modules /cmd/data-manager/node_modules
COPY cmd/data-manager/package.json /cmd/data-manager

USER aasuser
EXPOSE 4000

ENTRYPOINT [ "npm", "start" ]
