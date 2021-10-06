#!/usr/bin/env bash

set -eo pipefail

echo "--- Contracts Test Workflow"
source ./env.sh

sym local-network start --nodes 4

pip3 install --upgrade pip
pip install $HOME/.symbiont/versions/current/pytest/pytest_assembly-1.0.3-py3-none-any.whl

DEFAULT_NETWORK_CONFIG="$HOME/.symbiont/assembly-dev/dev-network/default/network-config.json"
pytest ../test/ --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../ --skip-consistency-check
