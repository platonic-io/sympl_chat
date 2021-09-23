#!/usr/bin/env bash

set -eo pipefail

echo "--- Contracts Test Workflow"
source ./env.sh

sym mock-network start

if ! timeout 30s bash -c 'until curl --silent http://localhost:8888/api/v1; do sleep 1; done'; then
    echo "Timed out waiting for sandbox to start"
    exit 1
fi

DEFAULT_NETWORK_CONFIG="$HOME/.symbiont/assembly-dev/mock-network/default/network-config.json"

sym network publish-contract -d ../
pytest ../test/ --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../
