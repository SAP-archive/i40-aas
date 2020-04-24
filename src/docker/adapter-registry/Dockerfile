FROM node:lts-alpine as builder

WORKDIR /cmd/adapter-registry

## copy package.json first and install dependencies to leverage caching
COPY cmd/adapter-registry/package.json /cmd/adapter-registry
COPY cmd/adapter-registry/package-lock.json /cmd/adapter-registry


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

## install & backup production dependencies
RUN cd /cmd/adapter-registry \
    && npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/adapter-registry/ /cmd/adapter-registry
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

# RUN adduser -D aasuser

WORKDIR /cmd/adapter-registry

## aas-logger ##
COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
COPY pkg/aas-logger/package.json /pkg/aas-logger/

## copy build output from previous stage
COPY --from=builder /cmd/adapter-registry/dist /cmd/adapter-registry/dist
COPY --from=builder /production-dependencies/node_modules /cmd/adapter-registry/node_modules
COPY cmd/adapter-registry/package.json /cmd/adapter-registry

# USER aasuser
EXPOSE 4500

ENTRYPOINT [ "npm", "start" ]
