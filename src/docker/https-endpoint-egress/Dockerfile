FROM node:lts-alpine as builder

WORKDIR /cmd/https-endpoint-egress/

## copy package.json first and install dependencies to leverage caching
COPY cmd/https-endpoint-egress/package.json /cmd/https-endpoint-egress/

## copy the local AMQPClient dependency, transpile it and install it
COPY pkg/AMQP-Client /pkg/AMQP-Client
RUN cd /pkg/AMQP-Client \
    && npm install \
    && npm run build \
    && cd /cmd/https-endpoint-egress/

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/https-endpoint-egress/ /cmd/https-endpoint-egress/
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/https-endpoint-egress/

## copy local dependencies
COPY --from=builder /pkg /pkg

## copy build output from previous stage
COPY --from=builder /cmd/https-endpoint-egress/dist /cmd/https-endpoint-egress/dist
COPY --from=builder /production-dependencies/node_modules /cmd/https-endpoint-egress/node_modules
COPY cmd/https-endpoint-egress/package.json /cmd/https-endpoint-egress/

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
