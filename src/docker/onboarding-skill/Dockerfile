FROM node:lts-alpine as builder

WORKDIR /cmd/onboarding-skill/


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


## Onboarding Service ##
COPY cmd/onboarding-skill/package.json /cmd/onboarding-skill/
COPY cmd/onboarding-skill/package-lock.json /cmd/onboarding-skill/
RUN cd /cmd/onboarding-skill 

## install & backup production dependencies
RUN npm install --production \
    && mkdir /production-dependencies/ 
RUN  cp -R node_modules /production-dependencies/

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

## aas-logger ##
COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
COPY pkg/aas-logger/package.json /pkg/aas-logger/

## AMQP-Client ##
COPY --from=builder /pkg/AMQP-Client/lib /pkg/AMQP-Client/lib
COPY --from=builder /AMQP-Client-production-dependencies/node_modules /pkg/AMQP-Client/node_modules
COPY pkg/AMQP-Client/package.json /pkg/AMQP-Client/


## Onboarding Service ##
COPY --from=builder /cmd/onboarding-skill/dist /cmd/onboarding-skill/dist
COPY --from=builder /production-dependencies/node_modules /cmd/onboarding-skill/node_modules
COPY cmd/onboarding-skill/package.json /cmd/onboarding-skill/

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
