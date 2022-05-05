import pytest

from assembly_client.api.contracts import ContractRef


@pytest.fixture(scope="function")
def chat_8(network, store):
    network.reset(sympl_version=8)

    network.publish([ContractRef('chat', '3.0.0', 8)])
    for alias in ['alice', 'bob']:
        store[alias] = network.register_key_alias()

    return lambda sender: network[store[sender]].chat["8-3.0.0"]  # return closure over sender
