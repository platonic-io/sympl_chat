#! /bin/bash
set -e 
sudo apt update && sudo apt install jq postgresql libpsql-dev

echo 'export PATH="$HOME/.pyenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv virtualenv-init -)"' >> ~/.bashrc

curl https://pyenv.run | bash
curl https://raw.githubusercontent.com/symbiont-io/symenv/main/install.sh | bash

cat <<EOF >> ~/.bashrc
export SYMENV_DIR="$HOME/.symbiont"
[ -s "$SYMENV_DIR/symenv.sh" ] && \. "$SYMENV_DIR/symenv.sh"  # This loads symenv
[ -s "$SYMENV_DIR/versions/current" ] && export PATH="$SYMENV_DIR/versions/current/bin":$PATH  # This loads symenv managed SDK
[ -s "$SYMENV_DIR/bash_completion" ] && \. "$SYMENV_DIR/bash_completion"  # This loads symenv bash_completion
eval "$(pyenv virtualenv-init -)"
EOF

source ~/.bashrc

pyenv install 3.9.1
pyenv global 3.9.1
pip install --user pipenv
pipenv install
pipenv run pip3 install $HOME/.symbiont/versions/current/pytest/symbiont_io.pytest_assembly-*.whl


