"""
Performance benchmarks for the Chat 2.0.0 contract.
"""

import pytest

from assembly.lang_8 import ContractError

from assembly.api import ContractRef


@pytest.fixture(scope="function")
def chat_8(network, store):
    network.reset(sympl_version=8)

    network.publish([ContractRef('chat', '3.0.0', 8)])
    for alias in ['alice', 'bob']:
        store[alias] = network.register_key_alias()

    return lambda sender: network[store[sender]].chat["8-3.0.0"]  # return closure over sender


@pytest.mark.usefixtures('network', 'store', 'chat_8', 'benchmark')
@pytest.mark.benchmark(group='chat')
class TestPerformance():
    @pytest.mark.parametrize('message_count', [1, 10, 100, 500, 1000], )
    @pytest.mark.parametrize('message_length', [1, 100, 1000, 10000, 100000], )
    def test_bench_send(self, benchmark, chat_8, store, message_length, message_count):
        create_room_event = chat_8('alice').create_room(room_name='room')
        room_channel = create_room_event['room']['channel']
        message = "e" * message_length
        kwargs={"room_channel": room_channel, "message_count": message_count, "message": message}
        def run(room_channel, message_count, message):
            for i in range(message_count):
                chat_8('alice').send_message(**kwargs)
                # print(f'sent message #{i}')
        benchmark.pedantic(run, kwargs=kwargs, iterations=1, rounds=1)
