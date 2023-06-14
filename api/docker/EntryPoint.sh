#!/bin/bash

parseSecret() {
  secret=$(aws secretsmanager get-secret-value --secret-id $1 | jq -r '.SecretString')

  echo $secret | jq -r '.key' |  base64 -d > /tls/client.key
  echo $secret | jq -r '.cert' |  base64 -d > /tls/client.crt
  echo $secret | jq -r '.chain' | base64 -d > /tls/ca.crt

}

initialize() {
  echo "initialize $1"
  parseSecret $1
}

# Get the appropriate certificates
echo "entrypoint ${AWS_POSTGRES_SECRET}"  

if [[ ! -z ${AWS_POSTGRES_SECRET} ]]; then
    echo "set ssl from secret manager"
    mkdir /tls
    initialize ${AWS_POSTGRES_SECRET}

    chmod 600 /tls/client.key
    chmod 600 /tls/client.crt
    chmod 600 /tls/ca.crt

    export POSTGRES_CA_CERT=/tls/ca.crt
    export POSTGRES_CLIENT_CERT=/tls/client.crt
    export POSTGRES_CLIENT_KEY=/tls/client.key
fi

exec "$@"
