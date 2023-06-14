#!/bin/sh

set -e

export REACT_APP_VAULT_API_URL="${REACT_APP_VAULT_API_URL}"
export REACT_APP_ENABLE_WYRE="${REACT_APP_ENABLE_WYRE:-false}"
export REACT_APP_VAULT_WS_URL="${REACT_APP_VAULT_WS_URL}"


SOURCE_FILE="${TEMPLATE_SOURCE_FILE:-/usr/share/nginx/html/index.html.template}"
DEST_FILE="${TEMPLATE_DEST_FILE:-/usr/share/nginx/html/index.html}"
SUBST_VARS=$(printf '${%s} ' $(env | cut -d= -f1 | grep VUE_))

echo "Running envsubst on ${SOURCE_FILE} to ${DEST_FILE}"
envsubst "${SUBST_VARS}" < "${SOURCE_FILE}" > "${DEST_FILE}"
