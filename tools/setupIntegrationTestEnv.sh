#!/usr/bin/env bash

set -x
set -e

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

function runIntegrationTestCleanup() {
  rm -rf "${INTEGRATION_TEST_TMP_ROOT_DIR}"
}

trap_add runIntegrationTestCleanup EXIT

export INTEGRATION_TEST_TMP_ROOT_DIR=`mktemp -d`

source "${TOOLS_DIR}/startNpmMirror.sh"
source "${TOOLS_DIR}/publishPackages.sh"
