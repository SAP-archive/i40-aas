FROM node:lts-alpine as builder

WORKDIR /cmd/https-endpoint-ingress/

## copy package.json first and install dependencies to leverage caching
COPY cmd/https-endpoint-ingress/package.json /cmd/https-endpoint-ingress/
COPY cmd/https-endpoint-ingress/yarn.lock /cmd/https-endpoint-ingress/
## copy the local AMQPClient dependency, transpile it and install it

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

## AMQP-Client ##
COPY pkg/AMQP-Client/package.json /pkg/AMQP-Client/
COPY pkg/AMQP-Client/yarn.lock /pkg/AMQP-Client/
RUN cd /pkg/AMQP-Client \
    && yarn install --production\
    && mkdir /AMQP-Client-production-dependencies/ \
    && cp -R node_modules /AMQP-Client-production-dependencies/ \
    && yarn install 

COPY pkg/AMQP-Client/ /pkg/AMQP-Client/

RUN cd /pkg/AMQP-Client \
    && yarn run clean \
    && yarn run build


RUN cd /cmd/https-endpoint-ingress \
    && yarn install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN yarn install

## add & transpile sourcecode
COPY cmd/https-endpoint-ingress/ /cmd/https-endpoint-ingress/
RUN yarn run clean \
    && yarn run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/https-endpoint-ingress/

## aas-logger ##
COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
COPY pkg/aas-logger/package.json /pkg/aas-logger/

## AMQP-Client ##
COPY --from=builder /pkg/AMQP-Client/lib /pkg/AMQP-Client/lib
COPY --from=builder /AMQP-Client-production-dependencies/node_modules /pkg/AMQP-Client/node_modules
COPY pkg/AMQP-Client/package.json /pkg/AMQP-Client/

## copy build output from previous stage
COPY --from=builder /cmd/https-endpoint-ingress/dist /cmd/https-endpoint-ingress/dist
COPY --from=builder /production-dependencies/node_modules /cmd/https-endpoint-ingress/node_modules
COPY cmd/https-endpoint-ingress/package.json /cmd/https-endpoint-ingress/

USER aasuser
EXPOSE 2000

ENTRYPOINT [ "npm", "start" ]
