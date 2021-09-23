#!/usr/bin/env bash

set -eo pipefail

# shellcheck source=./env.sh
source ./env.sh
echo "--- Setting up symenv"

curl https://raw.githubusercontent.com/symbiont-io/symenv/main/install.sh | bash
source ./env.sh

# SDK is installed
EXPECTED_SYMENV="Symbiont Assembly SDK Manager (v1.1.6-0-gd88fdea)"
