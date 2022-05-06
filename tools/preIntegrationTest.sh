#!/usr/bin/env bash

set -x
set -e

rm -rf /tmp/verdaccio-workspace/storage/@lifeomic /tmp/verdaccio-workspace/log.txt
mkdir -p /tmp/verdaccio-workspace

TOOLS_DIR="$(cd $(dirname ${BASH_SOURCE}); pwd)"

export NPM_REGISTRY_PORT="$(yarn ts-node ${TOOLS_DIR}/getPort.ts)"
custom_registry_url="http://localhost:${NPM_REGISTRY_PORT}"

export NPM_CONFIG_REGISTRY="$custom_registry_url"
export YARN_NPM_REGISTRY_SERVER="$custom_registry_url"
export YARN_UNSAFE_HTTP_WHITELIST="localhost"

tmp_registry_log='/tmp/verdaccio-workspace/log.txt'

function preIntegrationTestCleanup() {
  cd "${TOOLS_DIR}/.."
  yarn clean
  yarn constraints --fix
}

trap_add preIntegrationTestCleanup EXIT

yarn verdaccio --listen ${NPM_REGISTRY_PORT} --config "${TOOLS_DIR}/verdaccio-config.yaml" &> ${tmp_registry_log}  &
export NPM_REGISTRY_PID=$!

# wait for `verdaccio` to boot
grep -q 'http address' <(tail -f ${tmp_registry_log})

cd "${TOOLS_DIR}/.."

yarn tsc -p tsconfig.build.json
YARN_CONSTRAINTS_PATH="${TOOLS_DIR}/constraints.deploy.pro" yarn constraints --fix
YARN_NPM_PUBLISH_REGISTRY="$custom_registry_url" \
 YARN_NPM_AUTH_IDENT="username:password" \
 yarn workspaces foreach --no-private npm publish --tag intTest

yarn clean
yarn constraints --fix
