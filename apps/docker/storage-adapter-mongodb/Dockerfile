FROM node:lts-alpine as ts-builder

RUN apk update && apk upgrade && \	
    apk add --no-cache git openssh bash postgresql postgresql-contrib netcat-openbsd

WORKDIR /adapter

# Install required modules from package.json first to avoid frequent reinstallation
COPY package.json /adapter
RUN npm install

# Add & compile sourcecode
COPY . /adapter
RUN npm run clean \
    && npm run build

###################################
FROM node:lts-alpine

RUN adduser -D aasuser

WORKDIR /adapter

COPY --from=ts-builder /adapter/dist /adapter/dist
COPY package.json /adapter

RUN npm install --production

USER aasuser
EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
