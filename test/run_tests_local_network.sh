#!/usr/bin/env bash

set -eo pipefail

echo "--- Contracts Test Workflow"

sym local-network start --nodes 4

pip3 install symbiont-io.pytest-assembly==2.0.4.dev1

DEFAULT_NETWORK_CONFIG="$HOME/.symbiont/assembly-dev/dev-network/default/network-config.json"
pytest ../test/chat_9_3_0_0_model_test.py --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../ --baseline -p no:pytest-mp
pytest ../test/chat_9_3_0_0_coverage_test.py --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../ --baseline -p no:pytest-mp
pytest ../test/chat_9_3_0_0_demo_test.py --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../ --baseline -p no:pytest-mp
pytest ../test/chat_9_3_0_0_events_test.py --connection-file "$DEFAULT_NETWORK_CONFIG" --contract-path ../ --baseline -p no:pytest-mp
