FROM node:lts-alpine as builder

WORKDIR /cmd/https-endpoint-ingress/

## copy package.json first and install dependencies to leverage caching
COPY cmd/https-endpoint-ingress/package.json /cmd/https-endpoint-ingress/
COPY cmd/https-endpoint-ingress/package-lock.json /cmd/https-endpoint-ingress/
## copy the local AMQPClient dependency, transpile it and install it

## aas-logger ##
COPY pkg/aas-logger/package.json /pkg/aas-logger/
COPY pkg/aas-logger/package-lock.json /pkg/aas-logger/
RUN cd /pkg/aas-logger \
    && npm install --production\
    && mkdir /aas-logger-production-dependencies/ \
    && cp -R node_modules /aas-logger-production-dependencies/ \
    && npm install 


COPY pkg/aas-logger/ /pkg/aas-logger/

RUN cd /pkg/aas-logger \
    && npm run clean \
    && npm run build

## AMQP-Client ##
COPY pkg/AMQP-Client/package.json /pkg/AMQP-Client/
COPY pkg/AMQP-Client/package-lock.json /pkg/AMQP-Client/
RUN cd /pkg/AMQP-Client \
    && npm install --production\
    && mkdir /AMQP-Client-production-dependencies/ \
    && cp -R node_modules /AMQP-Client-production-dependencies/ \
    && npm install 

COPY pkg/AMQP-Client/ /pkg/AMQP-Client/

RUN cd /pkg/AMQP-Client \
    && npm run clean \
    && npm run build


RUN cd /cmd/https-endpoint-ingress \
    && npm install --production \
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
