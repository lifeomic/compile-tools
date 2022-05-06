#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"

export INTEGRATION_TEST_PROJECT_TMP_DIR=`mktemp -d`

#function cleanup() {
#  rm -rf "${INTEGRATION_TEST_PROJECT_TMP_DIR}"
#}
#
#trap_add cleanup EXIT

function installNpmProject () {
  PROJECT_DIR="${INTEGRATION_TEST_PROJECT_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  npm install
}

function installYarnProject () {
  PROJECT_DIR="${INTEGRATION_TEST_PROJECT_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  yarn set version stable

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  echo "npmRegistryServer: \"${YARN_NPM_REGISTRY_SERVER}\""

  yarn install --check-cache
}

(installNpmProject testProject1)
(installNpmProject testProject2)
(installYarnProject testProject3)
