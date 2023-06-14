# build stage 
ARG GOLANG_VERSION=1.18.6

FROM golang:${GOLANG_VERSION}-alpine AS build

ENV GO111MODULE=on

WORKDIR /app

COPY go.mod go.sum ./
#COPY client_types/go.mod client_types/go.sum ./client_types/

RUN go env -w GOPRIVATE=gitlab.com/loginid

ARG GITLAB_USER
ARG GITLAB_TOKEN

RUN apk add --no-cache git

RUN git config --global url."https://$GITLAB_USER:$GITLAB_TOKEN@gitlab.com/".insteadOf "https://gitlab.com/"

RUN go mod download

COPY . .

RUN go mod verify
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app

# final stage
FROM alpine:latest AS final

ENV PORT=${PORT:-3000}

RUN apk --no-cache add ca-certificates wget

WORKDIR /app

COPY --from=build /app/app .
COPY --from=build /app/db/migrations ./db/migrations

RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem
ENV POSTGRES_CA_CERT=/app/rds-combined-ca-bundle.pem

EXPOSE ${PORT:-3000}

### Add entry point support
COPY --from=build /app/docker/EntryPoint.sh ./EntryPoint.sh
RUN apk add --no-cache \
        bash \
        jq \
        python3 \
        py3-pip \
    && pip3 install --upgrade pip \
    && pip3 install \
        awscli \
    && rm -rf /var/cache/apk/*

RUN chmod 755 /app/EntryPoint.sh
ENTRYPOINT ["./EntryPoint.sh"]
CMD ["./app"]
