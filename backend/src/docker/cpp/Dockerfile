FROM alpine:3.20
RUN apk add --no-cache g++ && adduser -D -u 10001 runner
WORKDIR /submission
USER runner
