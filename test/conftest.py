import pytest

from assembly_client.api.contracts import ContractRef


@pytest.fixture(scope="function")
def chat_9(network, store):
    network.reset(sympl_version=9, txe_protocol=13)

    network.publish([ContractRef('chat', '3.0.0', 9)])
    for alias in ['alice', 'bob']:
        store[alias] = network.register_key_alias()

    return lambda sender: network[store[sender]].chat["9-3.0.0"]  # return closure over sender
