FROM alpine

RUN apk add curl

COPY main.sh /

RUN chmod +x main.sh

ENTRYPOINT ["/main.sh"]
