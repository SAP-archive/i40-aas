FROM node:lts-alpine AS builder

WORKDIR /cmd/data-manager

## copy package.json first and install dependencies to leverage caching
COPY cmd/data-manager/package.json /cmd/data-manager

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/data-manager/ /cmd/data-manager
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/data-manager

## copy build output from previous stage
COPY --from=builder /cmd/data-manager/dist /cmd/data-manager/dist
COPY --from=builder /production-dependencies/node_modules /cmd/data-manager/node_modules
COPY cmd/data-manager/package.json /cmd/data-manager

USER aasuser
EXPOSE 4000

ENTRYPOINT [ "npm", "start" ]
