FROM node:lts-alpine as builder

WORKDIR /wdir

## copy package.json first and proceed to install dependencies to leverage caching as much as possible
##   1. install production dependencies and create a copy of node_modules to be reused in prod stage below
##   2. install dev dependencies
COPY cmd/https-endpoint-ingress/package.json /wdir

# copy the amqp lib and install is as local dependency module
COPY pkg/AMQP-Client /pkg/AMQP-Client
RUN cd /pkg/AMQP-Client && npm install && npm run build
WORKDIR /wdir
RUN npm install --save /pkg/AMQP-Client

RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/
RUN npm install

# Add & compile sourcecode
COPY cmd/https-endpoint-ingress/ /wdir
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /wdir

COPY --from=builder /wdir/dist /wdir/dist
COPY --from=builder /production-dependencies/node_modules /wdir/node_modules
COPY cmd/https-endpoint-ingress/package.json /wdir

USER aasuser
EXPOSE 2000

ENTRYPOINT [ "npm", "start" ]
