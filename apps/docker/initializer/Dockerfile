FROM alpine

RUN apk add --no-cache bash && \
    apk add --no-cache curl

COPY docker/initializer/main.sh /

RUN chmod +x main.sh

ENTRYPOINT ["/main.sh"]
