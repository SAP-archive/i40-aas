FROM node:lts-alpine as builder

WORKDIR /cmd/endpoint-registry-ui

## copy package.json first and install dependencies to leverage caching
COPY /cmd/endpoint-registry-ui/ /cmd/endpoint-registry-ui

WORKDIR /cmd/endpoint-registry-ui

RUN npm set @sap:registry=https://npm.sap.com


# ## install dependencies
RUN npm install


RUN adduser -D aasuser
USER aasuser


EXPOSE 4400
ENTRYPOINT [ "npm", "start" ]

