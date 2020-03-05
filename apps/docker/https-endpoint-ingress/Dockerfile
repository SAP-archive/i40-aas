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

RUN adduser -D aasuser

WORKDIR /service

COPY --from=ts-builder /service/dist /service/dist
COPY package.json /service

RUN npm install --production

USER aasuser
EXPOSE 2000

ENTRYPOINT [ "npm", "start" ]
