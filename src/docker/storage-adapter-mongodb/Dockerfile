FROM node:lts-alpine as builder

RUN apk update && apk upgrade && \
    apk add --no-cache git openssh bash postgresql postgresql-contrib netcat-openbsd

WORKDIR /cmd/storage-adapter-mongodb/

## copy package.json first and install dependencies to leverage caching
COPY cmd/storage-adapter-mongodb/package.json /cmd/storage-adapter-mongodb

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/storage-adapter-mongodb/ /cmd/storage-adapter-mongodb
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/storage-adapter-mongodb

## copy build output from previous stage
COPY --from=builder /cmd/storage-adapter-mongodb/dist /cmd/storage-adapter-mongodb/dist
COPY --from=builder /production-dependencies/node_modules /cmd/storage-adapter-mongodb/node_modules
COPY cmd/storage-adapter-mongodb/package.json /cmd/storage-adapter-mongodb

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
