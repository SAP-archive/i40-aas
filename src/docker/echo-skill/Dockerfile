## Ref.:
## https://nodered.org/docs/getting-started/docker#dockerfile-which-copies-in-local-resources

FROM nodered/node-red

COPY echo-skill/ ./
RUN yarn install

COPY echo-skill/lib ./node_modules/node-red-contrib-amqp/lib
