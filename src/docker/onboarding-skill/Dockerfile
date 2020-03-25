FROM node:lts-alpine as builder

WORKDIR /cmd/onboarding-skill/

## copy package.json first and install dependencies to leverage caching
COPY cmd/onboarding-skill/package.json /cmd/onboarding-skill/

## copy the local AMQPClient dependency, transpile it and install it
COPY pkg/AMQP-Client /pkg/AMQP-Client
RUN cd /pkg/AMQP-Client \
    && npm install \
    && npm run build \
    && cd /cmd/onboarding-skill

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ \
    && cp -R node_modules /production-dependencies/

## install dependencies
RUN npm install

## add & transpile sourcecode
COPY cmd/onboarding-skill/ /cmd/onboarding-skill/
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine as prod

RUN adduser -D aasuser

WORKDIR /cmd/onboarding-skill/

## copy local dependencies
COPY --from=builder /pkg /pkg

## copy build output from previous stage
COPY --from=builder /cmd/onboarding-skill/dist /cmd/onboarding-skill/dist
COPY --from=builder /production-dependencies/node_modules /cmd/onboarding-skill/node_modules
COPY cmd/onboarding-skill/package.json /cmd/onboarding-skill/

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
