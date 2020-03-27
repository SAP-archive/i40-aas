FROM node:lts-alpine as builder

WORKDIR /cmd/https-endpoint-ingress/

## copy package.json first and install dependencies to leverage caching
COPY cmd/https-endpoint-ingress/package.json /cmd/https-endpoint-ingress/

## copy the local AMQPClient dependency, transpile it and install it
COPY pkg/AMQP-Client /pkg/AMQP-Client
RUN cd /pkg/AMQP-Client \
    && npm install \
    && npm run build \
    && cd /cmd/https-endpoint-ingress

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/https-endpoint-ingress/ /cmd/https-endpoint-ingress/
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/https-endpoint-ingress/

## copy local dependencies
COPY --from=builder /pkg /pkg

## copy build output from previous stage
COPY --from=builder /cmd/https-endpoint-ingress/dist /cmd/https-endpoint-ingress/dist
COPY --from=builder /production-dependencies/node_modules /cmd/https-endpoint-ingress/node_modules
COPY cmd/https-endpoint-ingress/package.json /cmd/https-endpoint-ingress/

USER aasuser
EXPOSE 2000

ENTRYPOINT [ "npm", "start" ]
