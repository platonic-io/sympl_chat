#!/usr/bin/env sh
NETWORK_NAME=chat
if [ $1 ]
then
    PORT=$1
else
    PORT=18888
fi

if test -f "./network_config.json"; then
    rm ./network_config.json
fi
if test -f "./users.json"; then
    rm ./users.json
fi
#create a mock network and publish the contract
#so the routes and js client can be generated
sym local-network start -n $NETWORK_NAME --port $PORT
#get the path to the config file of the local network
#and make sym link to it, so it can be used
#when connecting from the assembly client
CONFIG_PATH=$(sym local-network info -n $NETWORK_NAME | jq -r .network_config)
sym network publish-contract -c $CONFIG_PATH --contract-dir ../../
if [[ ! $? ]]; then
    echo "Error, couldn't publish chat"
    exit 1
fi
sym generate -c $CONFIG_PATH -o ./@assembly
sym generate -c $CONFIG_PATH -i ./src/routes/templates -o ./src/routes/generated
#remove an unnecessary files
rm ./src/routes/generated/lib.js
ln -s $CONFIG_PATH network_config.json