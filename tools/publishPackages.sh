#!/usr/bin/env bash

set -x
set -e

function preIntegrationTestCleanup() {
  cd "${TOOLS_DIR}/.."
  yarn clean
  yarn constraints --fix
}

trap_add preIntegrationTestCleanup EXIT

cd "${TOOLS_DIR}/.."

yarn tsc -p tsconfig.build.json
YARN_CONSTRAINTS_PATH="${TOOLS_DIR}/constraints.deploy.pro" yarn constraints --fix
YARN_NPM_PUBLISH_REGISTRY="$custom_registry_url" \
 YARN_NPM_AUTH_IDENT="username:password" \
 yarn workspaces foreach --no-private npm publish --tag intTest

yarn clean
yarn constraints --fix
