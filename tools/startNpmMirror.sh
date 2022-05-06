#!/usr/bin/env bash

set -x
set -e


function startNpmMirrorCleanup() {
  if [ -n "${NPM_REGISTRY_PID}" ]; then
    kill "${NPM_REGISTRY_PID}"
  fi
}

trap_add startNpmMirrorCleanup EXIT


export VERDACCIO_STORAGE_PATH="${INTEGRATION_TEST_TMP_ROOT_DIR}/verdaccio"
mkdir -p "${VERDACCIO_STORAGE_PATH}"

tmp_registry_log="${VERDACCIO_STORAGE_PATH}/registryLog.txt"

export NPM_REGISTRY_PORT="$(yarn ts-node ${TOOLS_DIR}/getPort.ts)"
yarn verdaccio --listen ${NPM_REGISTRY_PORT} --config "${TOOLS_DIR}/verdaccio-config.yaml" &> ${tmp_registry_log}  &
export NPM_REGISTRY_PID=$!

# wait for `verdaccio` to boot
grep -q 'http address' <(tail -f ${tmp_registry_log})

custom_registry_url="http://localhost:${NPM_REGISTRY_PORT}"

export NPM_CONFIG_REGISTRY="$custom_registry_url"
export YARN_NPM_REGISTRY_SERVER="$custom_registry_url"
export YARN_UNSAFE_HTTP_WHITELIST="localhost"

