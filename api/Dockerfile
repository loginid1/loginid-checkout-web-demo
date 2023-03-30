ARG GO_VERSION=1.20
FROM golang:${GO_VERSION}-alpine

RUN apk add --no-cache git

RUN mkdir /app && adduser -u 1000 -D user && chown 1000 /app
WORKDIR /app
COPY --chown=1000 . /app
USER 1000

RUN go env -w GOPRIVATE=gitlab.com/loginid

ARG GITLAB_USER
ARG GITLAB_TOKEN

RUN git config --global url."https://$GITLAB_USER:$GITLAB_TOKEN@gitlab.com/".insteadOf "https://gitlab.com/"

RUN go install github.com/cosmtrek/air@latest

CMD air -c .air.toml
