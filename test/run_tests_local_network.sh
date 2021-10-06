#!/usr/bin/env bash

set -eo pipefail

echo "--- Contracts Test Workflow"
source ./env.sh

sym local-network start --nodes 4

DEFAULT_NETWORK_CONFIG="$HOME/.symbiont/assembly-dev/dev-network/default/network-config.json"
pytest ../test/ --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../ --skip-consistency-check
