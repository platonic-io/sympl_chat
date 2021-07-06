import pytest

from assembly.lang_8 import ContractRef

@pytest.mark.usefixtures('network', 'store', 'chat_8')
class TestChatRepl():

    def test_repl(self, chat_8, store, network):
        print("Available users are 'alice', 'bob', and 'eve'.")
        print("Call contract like this: chat('alice').create_room(room='my_room')")
        breakpoint()
