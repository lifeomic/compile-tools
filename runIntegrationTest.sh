#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"

function cleanup() {
  cd ${DIRECTORY}
  yarn clean
  yarn constraints --fix
  rm -rf /tmp/verdaccio-workspace
  if [ -n ${NPM_REGISTRY_PID} ]; then
    kill $NPM_REGISTRY_PID
  fi
}

trap cleanup EXIT

source "${DIRECTORY}/tools/preIntegrationTest.sh"
cd $INIT_CWD
yarn run-integration-test

