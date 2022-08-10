import pytest

from assembly_client.api.contracts import ContractRef


@pytest.fixture(scope="function")
def chat_10(network, store):
    network.reset(sympl_version=10)

    network.publish([ContractRef('chat', '1.0.0', 10)])
    for alias in ['alice', 'bob']:
        store[alias] = network.register_key_alias()

    return lambda sender: network[store[sender]].chat["10-1.0.0"]  # return closure over sender
