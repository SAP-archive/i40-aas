FROM node:lts-alpine as builder

WORKDIR /cmd/endpoint-registry-ui

## copy package.json first and install dependencies to leverage caching
COPY /cmd/endpoint-registry-ui/ .
# COPY cmd/endpoint-registry-ui/yarn.lock /cmd/endpoint-registry-ui


## aas-logger ##
# COPY pkg/aas-logger/package.json /pkg/aas-logger/
# COPY pkg/aas-logger/yarn.lock /pkg/aas-logger/
# RUN cd /pkg/aas-logger \
#     && yarn install --production\
#     && mkdir /aas-logger-production-dependencies/ \
#     && cp -R node_modules /aas-logger-production-dependencies/ \
#     && yarn install


# COPY pkg/aas-logger/ /pkg/aas-logger/

# RUN cd /pkg/aas-logger \
#     && yarn run clean \
#     && yarn run build


# ## install & backup production dependencies
# RUN yarn install --production \
#     && mkdir /production-dependencies/ \
#     && cp -R node_modules /production-dependencies/

 RUN npm set @sap:registry=https://npm.sap.com

# ## install dependencies
 RUN npm install



# ###################################
# FROM node:lts-alpine as prod

# RUN adduser -D aasuser

# WORKDIR /cmd/endpoint-registry-ui


# ## aas-logger ##
# COPY --from=builder /pkg/aas-logger/lib /pkg/aas-logger/lib
# COPY --from=builder /aas-logger-production-dependencies/node_modules /pkg/aas-logger/node_modules
# COPY pkg/aas-logger/package.json /pkg/aas-logger/

# ## copy build output from previous stage
# COPY --from=builder /production-dependencies/node_modules /cmd/endpoint-registry-ui/node_modules
# COPY cmd/endpoint-registry-ui/package.json /cmd/endpoint-registry-ui


# USER aasuser
EXPOSE 8080

ENTRYPOINT [ "npm", "start" ]

