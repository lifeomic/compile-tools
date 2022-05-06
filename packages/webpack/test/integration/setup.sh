#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"

function installNpmProject () {
  PROJECT_DIR="${INTEGRATION_TEST_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  npm install > /dev/null
}

function installYarnProject () {
  PROJECT_DIR="${INTEGRATION_TEST_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  yarn set version stable

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  echo "npmRegistryServer: \"${YARN_NPM_REGISTRY_SERVER}\""

  yarn install --check-cache > /dev/null
}

(installNpmProject testProject1)
(installNpmProject testProject2)
(installYarnProject testProject3)
