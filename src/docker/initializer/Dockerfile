FROM alpine

RUN apk add --no-cache bash && \
    apk add --no-cache curl

COPY main.sh /

RUN chmod +x main.sh

ENTRYPOINT ["/main.sh"]
