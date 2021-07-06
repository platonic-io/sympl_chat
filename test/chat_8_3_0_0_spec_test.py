"""
Specifications for the Chat 3.0.0 contract.
"""

import pytest
import time

from assembly.lang_8 import ContractRef, ContractError

import utils.chat_8_3_0_0_test_utils as utils

# Chat messages are up to 4000 Unicode characters long (the same limitation used by Slack).
MESSAGE_LENGTH = 4000

# Up to 2500 messages per room are supported.
MESSAGES_PER_ROOM = 2500

# One to ten users per room are supported.
USERS_PER_ROOM = 10


@pytest.mark.fails_remote  # as of 2018-04-30 this takes about ten minutes on a real network, which is a bit too long
@pytest.mark.usefixtures('network', 'store', 'chat_8')
class TestChatStress():
    def test_stress(self, chat_8, store, network):
        message = 'x' * MESSAGE_LENGTH
        create_room_event = chat_8('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        for i in range(USERS_PER_ROOM - 1):
            print(f"Inviting user {i}...")
            store[f"user_{i}"] = network.register_key_alias()
        for i in range(MESSAGES_PER_ROOM):
            print(f"Sending message {i}...")
            chat_8('alice').send_message(room_channel=room, message=message)
        start = time.time()
        chat_8('alice').get_messages(room_channel=room)
        end = time.time()
        print("Retrieval latency: {0:.2f}ms".format((end - start) * 1000))
