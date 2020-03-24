FROM node:lts-alpine as builder

WORKDIR /cmd/adapter-registry

## copy package.json first and install dependencies to leverage caching
COPY cmd/adapter-registry/package.json /cmd/adapter-registry

## install & backup production dependencies
RUN npm install --production \
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

## copy build output from previous stage
COPY --from=builder /cmd/adapter-registry/dist /cmd/adapter-registry/dist
COPY --from=builder /production-dependencies/node_modules /cmd/adapter-registry/node_modules
COPY cmd/adapter-registry/package.json /cmd/adapter-registry

# USER aasuser
EXPOSE 4500

ENTRYPOINT [ "npm", "start" ]
