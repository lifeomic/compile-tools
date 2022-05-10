#!/usr/bin/env bash

set -x
set -e

export TOOLS_DIR="$(cd $(dirname ${BASH_SOURCE}); pwd)"

source "${TOOLS_DIR}/setupIntegrationTestEnv.sh"

yarn workspaces foreach --exclude compile-tools run integration-test
