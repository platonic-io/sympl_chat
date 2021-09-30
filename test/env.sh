#!/usr/bin/env bash

export SYMENV_DIR="$HOME/.symbiont"
export SYMENV_DEBUG=1

SYMENVRC="$HOME/.symenvrc"

if [ -z "${CI_SYMENVRC}" ];then
    if [ -e "$SYMENVRC" ] && [[ $(grep -c '_auth_token' "$SYMENVRC") = 1 ]];then
        echo "Using $SYMENVRC with existing token."
    else
        echo "\$CI_SYMENVRC not set! Aborting."
        exit 1
    fi
else
    if [ -e "$SYMENVRC" ]; then
        awk '!/_auth_token/' "$SYMENVRC" > symenvrc.temp && mv symenvrc.temp "$SYMENVRC"
    fi
    conf=$(echo "$CI_SYMENVRC" | base64 -d)
    echo "$conf" >> "$SYMENVRC"
fi

if [ -s "$SYMENV_DIR/symenv.sh" ]; then
    echo "Loading symenv from $SYMENV_DIR"
    # shellcheck disable=SC1091
    [ -s "$SYMENV_DIR/symenv.sh" ] && \. "$SYMENV_DIR/symenv.sh"  # This loads symenv
    [ -s "$SYMENV_DIR/versions/current" ] && export PATH=$PATH:"$SYMENV_DIR/versions/current/bin"  # This loads symenv managed SDK
    # shellcheck disable=SC1091
    [ -s "$SYMENV_DIR/bash_completion" ] && \. "$SYMENV_DIR/bash_completion"  # This loads symenv bash_completion
fi
