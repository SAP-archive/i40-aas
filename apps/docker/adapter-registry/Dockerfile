FROM node:lts-alpine as ts-builder

WORKDIR /service

# Install required modules from package.json first to avoid frequent reinstallation
COPY package.json /service
RUN npm install

# Add & compile sourcecode
COPY . /service
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine

## TODO: Uncomment once node-persist has been removed and file system permissions are no longer required
#RUN adduser -D aasuser

WORKDIR /service

COPY --from=ts-builder /service/dist /service/dist
COPY package.json /service

RUN npm install --production

## TODO: Uncomment once node-persist has been removed and file system permissions are no longer required
#USER aasuser
EXPOSE 4500

ENTRYPOINT [ "npm", "start" ]
