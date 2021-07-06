"""Regression tests for a standard demonstration of the Chat 3.0.0 contract.

Demo:
1. Create users Alice, Bob, and Eve.
2. NOTE(matthew-piziak): Here omit the ugly user management part of the old demo, with the old key-alias behavior of
having to separately register each key alias for chat.
3. Alice creates a room.
4. Alice invites Bob to the room.
5. Alice sends message 'hi Bob' to Bob.
6. Bob sends message 'hi Alice' to Alice.
7. Alice gets both messages.
8. Bob gets both messages.
9. Eve gets a 'room unknown' error.
10. Alice removes Bob.
11. Alice sends message 'hi me' to herself.
12. Alice gets all three messages.
13. Bob gets a 'room unknown' error.

Possible demo extensions:
- event system
"""

import pytest

from assembly.lang_8 import ContractRef, ContractError

import utils.chat_8_3_0_0_test_utils as utils


@pytest.mark.incremental
@pytest.mark.usefixtures('network', 'store')
class TestChatDemo():

    # setup

    CHAT = ContractRef('chat', '3.0.0', 8)

    def test_reset(self, network):
        """Start with a clean network."""
        network.reset(sympl_version=8)

    def test_register_key_aliases(self, network, store):
        """Register identities for two communicating users Alice and Bob, and one evesdropper Eve."""
        for i in ['alice', 'bob', 'eve']:
            store[i] = network.register_key_alias()

    def test_publish(self, network, store):
        """Publish the chat contract to the network."""
        breakpoint
        network.publish([self.CHAT])

    # utilities

    @pytest.fixture(scope="function")
    def chat(self, network, store):
        """Fixture usage example: chat('alice').create_room(...)"""
        return lambda sender: network[store[sender]].chat["8-3.0.0"]  # return closure over sender

    @pytest.fixture(scope="function")
    def room(self, store):
        return store['room_channel']

    # demo test

    def test_alice_create_room(self, chat, store):
        """Alice creates a room."""
        create_room_event = chat('alice').create_room(room_name='topsecret')
        room_channel = create_room_event['room']['channel']
        store['room_channel'] = room_channel

    def test_alice_invites_bob(self, chat, room, store):
        """Alice invites Bob."""
        chat('alice').invite_to_room(room_channel=room, new_member=store['bob'])

    def test_alice_sends_message_to_bob(self, chat, room):
        """Alice sends message 'Hello, Bob!' to Bob."""
        chat('alice').send_message(room_channel=room, message="Hello, Bob!")

    def test_bob_sends_message_to_alice(self, chat, room):
        """Bob sends message 'Hey, Alice' to Alice."""
        chat('bob').send_message(room_channel=room, message="Hey, Alice")

    def test_alice_gets_both_messages(self, chat, room, store):
        """Alice should see 'Hello, Bob!' and 'Hey, Alice'."""
        messages = chat('alice').get_messages(room_channel=room)
        utils.scrub_ids_and_timestamps(messages)
        assert messages == [{'sender': store['alice'], 'body': 'Hello, Bob!'},
                            {'sender': store['bob'], 'body': 'Hey, Alice'}]

    def test_bob_gets_both_messages(self, chat, room, store):
        """Bob should see 'Hello, Bob!' and 'Hey, Alice'."""
        messages = chat('bob').get_messages(room_channel=room)
        utils.scrub_ids_and_timestamps(messages)
        assert messages == [{'sender': store['alice'], 'body': 'Hello, Bob!'},
                            {'sender': store['bob'], 'body': 'Hey, Alice'}]

    def test_eve_gets_neither_message(self, chat, room):
        """Eve, having not been invited, should see neither message."""
        with pytest.raises(ContractError) as e:
            chat('eve').get_messages(room_channel=room)
        assert f"Room for channel {room} not found." in str(e.value.message)

    def test_alice_removes_bob(self, chat, room, store):
        """Alice removes Bob."""
        chat('alice').remove_from_room(room_channel=room, member_to_remove=store['bob'])

    def test_alice_sends_message(self, chat, room):
        """Alice sends a message to herself, being the only remaining user."""
        chat('alice').send_message(room_channel=room, message="hi me")

    def test_alice_gets_all_messages(self, chat, room, store):
        """Alice should see 'Hello, Bob!', 'Hey, Alice', and 'hi me'."""
        messages = chat('alice').get_messages(room_channel=room)
        utils.scrub_ids_and_timestamps(messages)
        assert messages == [{'sender': store['alice'], 'body': 'Hello, Bob!'},
                            {'sender': store['bob'], 'body': 'Hey, Alice'}, {'sender': store['alice'], 'body': 'hi me'}]

    def test_bob_gets_no_messages(self, chat, room, store):
        """Bob, having been removed, cannot see new messages."""
        messages = chat('bob').get_messages(room_channel=room)
        utils.scrub_ids_and_timestamps(messages)
        assert messages == [{'sender': store['alice'], 'body': 'Hello, Bob!'},
                            {'sender': store['bob'], 'body': 'Hey, Alice'}]
