"""
Event-system test for Chat 3.0.0.
"""

import pytest

ROOM_NAME = 'room'


def _is_room_event_present(events, room_name, event_type):
    def is_room_event_match(event):
        return event['type'] == ('chat/3.0.0/' + event_type) and event['data']['room']['name'] == room_name

    return any([is_room_event_match(event) for event in events])


@pytest.mark.usefixtures('network', 'store', 'chat_8')
@pytest.mark.fails_remote
class TestChatCoverage():
    def test_create_room(self, chat_8, network):
        chat_8('alice').create_room(room_name=ROOM_NAME)
        assert _is_room_event_present(network.events(), ROOM_NAME, 'CreateRoomEvent')

    def test_delete_room(self, chat_8, network):
        room = chat_8('alice').create_room(room_name=ROOM_NAME)['room']['channel']
        chat_8('alice').delete_room(room_channel=room)
        assert _is_room_event_present(network.events(), ROOM_NAME, 'DeleteRoomEvent')

    def test_restore_room(self, chat_8, network):
        room = chat_8('alice').create_room(room_name=ROOM_NAME)['room']['channel']
        chat_8('alice').delete_room(room_channel=room)
        chat_8('alice').restore_room(room_channel=room)
        assert _is_room_event_present(network.events(), ROOM_NAME, 'RestoreRoomEvent')

    def test_invite_to_room(self, chat_8, network, store):
        room = chat_8('alice').create_room(room_name=ROOM_NAME)['room']['channel']
        chat_8('alice').invite_to_room(room_channel=room, new_member=store['bob'])
        assert _is_room_event_present(network.events(), ROOM_NAME, 'InviteToRoomEvent')

    def test_remove_from_room(self, chat_8, network, store):
        room = chat_8('alice').create_room(room_name=ROOM_NAME)['room']['channel']
        chat_8('alice').invite_to_room(room_channel=room, new_member=store['bob'])
        chat_8('alice').remove_from_room(room_channel=room, member_to_remove=store['bob'])
        assert _is_room_event_present(network.events(), ROOM_NAME, 'RemoveFromRoomEvent')

    def test_send_message(self, chat_8, network):
        room = chat_8('alice').create_room(room_name=ROOM_NAME)['room']['channel']
        chat_8('alice').send_message(room_channel=room, message="message")
        assert _is_room_event_present(network.events(), ROOM_NAME, 'SendMessageEvent')
