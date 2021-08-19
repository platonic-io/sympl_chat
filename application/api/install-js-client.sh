NETWORK_NAME=chat
if [$1]
then
    PORT=$1
else
    PORT=18888
fi
rm ./network_config.json
sym mock-network start -n $NETWORK_NAME --port $PORT
sym network publish-contract -n $NETWORK_NAME --contract-dir ../../
sym generate -n $NETWORK_NAME -o ./@assembly
sym generate -n $NETWORK_NAME -i ./src/routes/templates -o ./src/routes/generated
rm ./src/routes/generated/lib.js
CONFIG_PATH=$(sym mock-network info -n $NETWORK_NAME | jq -r .network_config)
ln -s $CONFIG_PATH network_config.json
rm ./users.json