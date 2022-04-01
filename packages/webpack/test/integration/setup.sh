#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"

export INTEGRATION_TEST_PROJECT_TMP_DIR=`mktemp -d`

function installProject () {
  cp -r ${DIRECTORY}/../fixtures/ ${INTEGRATION_TEST_PROJECT_TMP_DIR}

  cd ${INTEGRATION_TEST_PROJECT_TMP_DIR}

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  npm install
}

(installProject)
