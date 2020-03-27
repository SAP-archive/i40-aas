FROM mhart/alpine-node:10

WORKDIR /cmd/i40-aas-node-red-simple-skill/

# Home directory for Node-RED application source code.
RUN mkdir -p /usr/src/node-red

# User data directory, contains flows, config and nodes.
WORKDIR /usr/src/node-red

# Add node-red user so we aren't running as root.
RUN adduser -h /usr/src/node-red -D -H node-red \
   # && chown -R node-red:node-red /data \
    && chown -R node-red:node-red /usr/src/node-red
COPY cmd/i40-aas-node-red-simple-skill/customNodes ./customNodes
USER node-red

# package.json contains Node-RED NPM module and node dependencies
COPY cmd/i40-aas-node-red-simple-skill/package.json /usr/src/node-red/
RUN npm install

ADD cmd/i40-aas-node-red-simple-skill/lib /usr/src/node-red/node_modules/node-red-contrib-amqp/lib

# User configuration directory volume
VOLUME ["/data"]
EXPOSE 1880

# Environment variable holding file path for flows configuration
ENV FLOWS=flows.json

CMD ["npm", "start", "--", "--userDir", "/data"]