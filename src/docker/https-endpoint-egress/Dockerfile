FROM node:lts-alpine as builder

WORKDIR /wdir

## copy package.json first and proceed to install dependencies to leverage caching as much as possible
##   1. install local modules
##   2. install production dependencies and create a copy of node_modules to be reused in prod stage below
##   3. install dev dependencies
COPY cmd/https-endpoint-egress/package.json /wdir

## copy the local AMQPClient dependency, transpile it and install it
COPY pkg/AMQP-Client pkg/AMQP-Client
RUN cd pkg/AMQP-Client \
    && npm install \
    && npm run build \
    && cd ../../ \
    && npm install --save ./pkg/AMQP-Client

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

# Add & compile sourcecode
COPY cmd/https-endpoint-egress/ /wdir
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /wdir

COPY --from=builder /wdir/dist /wdir/dist
COPY --from=builder /production-dependencies/node_modules /wdir/node_modules
COPY cmd/https-endpoint-egress/package.json /wdir

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
