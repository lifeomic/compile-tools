#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"

set -e

SILENT_LOG="${DIRECTORY}/silent_log_$$.txt"
trap_add "/bin/rm -f $SILENT_LOG" EXIT

function report_and_exit {
  cat "${SILENT_LOG}";
  echo "\033[91mError running command.\033[39m"
  exit 1;
}

function silent {
  $* 2>>"${SILENT_LOG}" >> "${SILENT_LOG}" || report_and_exit;
}


function installNpmProject () {
  PROJECT_DIR="${INTEGRATION_TEST_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  silent npm install > /dev/null
}

function installYarnProject () {
  PROJECT_DIR="${INTEGRATION_TEST_TMP_DIR}/$1"
  mkdir -p "${PROJECT_DIR}"
  cp -r ${DIRECTORY}/../$1/. ${PROJECT_DIR}/.

  cd ${PROJECT_DIR}

  yarn set version stable

  echo "registry=${YARN_NPM_REGISTRY_SERVER}" > .npmrc

  echo "npmRegistryServer: \"${YARN_NPM_REGISTRY_SERVER}\""

  silent yarn install
}

(installNpmProject testProject1)
(installNpmProject testProject2)
(installYarnProject testProject3)
