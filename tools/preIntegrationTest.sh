#!/usr/bin/env bash

set -x
set -e

export TOOLS_DIR="$(cd $(dirname ${BASH_SOURCE}); pwd)"

if [ -z ${INTEGRATION_TEST_TMP_ROOT_DIR+x} ]; then
  source "${TOOLS_DIR}/setupIntegrationTestEnv.sh"
fi

export INTEGRATION_TEST_TMP_DIR="${INTEGRATION_TEST_TMP_ROOT_DIR}/compile-tools/$(basename "${INIT_CWD}")"
mkdir -p "${INTEGRATION_TEST_TMP_DIR}"

cd "${INIT_CWD}"
yarn run-integration-test
