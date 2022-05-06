#!/usr/bin/env bash

set -x
set -e

DIRECTORY="$(cd $(dirname ${BASH_SOURCE}); pwd)"
mkdir -p /tmp/verdaccio-workspace

function runIntegrationTestCleanup() {
  if [ -n "${NPM_REGISTRY_PID}" ]; then
    kill "${NPM_REGISTRY_PID}"
  fi
  rm -rf /tmp/verdaccio-workspace
}


log() { printf '%s\n' "$*"; }
error() { log "ERROR: $*" >&2; }
fatal() { error "$@"; exit 1; }

trap_add() {
    trap_add_cmd=$1; shift || fatal "${FUNCNAME} usage error"
    for trap_add_name in "$@"; do
        trap -- "$(
            # helper fn to get existing trap command from output
            # of trap -p
            extract_trap_cmd() { printf '%s\n' "$3"; }
            # print existing trap command with newline
            eval "extract_trap_cmd $(trap -p "${trap_add_name}")"
            # print the new trap command
            printf '%s\n' "${trap_add_cmd}"
        )" "${trap_add_name}" \
            || fatal "unable to add to trap ${trap_add_name}"
    done
}
# set the trace attribute for the above function.  this is
# required to modify DEBUG or RETURN traps because functions don't
# inherit them unless the trace attribute is set
declare -f -t trap_add

trap_add runIntegrationTestCleanup EXIT

source "${DIRECTORY}/preIntegrationTest.sh"
cd "$INIT_CWD"
yarn run-integration-test

