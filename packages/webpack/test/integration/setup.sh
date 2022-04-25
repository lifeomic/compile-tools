#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"

export INTEGRATION_TEST_PROJECT_TMP_DIR=`mktemp -d`

function installProject () {
  PROJECT_DIR="${INTEGRATION_TEST_PROJECT_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  npm install
}

(installProject testProject1)
(installProject testProject2)
