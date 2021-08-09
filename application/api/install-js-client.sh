NETWORK_NAME=chat
rm ./network_config.json
sym mock-network start -n $NETWORK_NAME --port 18888
sym network publish-contract -n $NETWORK_NAME --contract-dir ../../
sym generate -n $NETWORK_NAME -o ./@assembly
CONFIG_PATH=$(sym mock-network info -n $NETWORK_NAME | jq -r .network_config)
ln -s $CONFIG_PATH network_config.json