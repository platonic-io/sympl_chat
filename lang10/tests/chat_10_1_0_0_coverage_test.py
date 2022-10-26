"""
Basic API coverage tests for Chat 1.0.0.
"""

import pytest

from assembly_client.api.types.error_types import ContractError

import utils.chat_10_1_0_0_test_utils as utils


def _assert_error(e, expected):
    assert expected in str(e.value.message)


@pytest.mark.usefixtures('network', 'store', 'chat_10')
class TestChatCoverage():
    def test_create_room(self, chat_10, store):
        """When a user creates a room, they are able to send messages, get messages, and invite more users."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').get_messages(room_channel=room)
        chat_10('alice').send_message(room_channel=room, message='message')
        chat_10('alice').invite_to_room(room_channel=room, new_member=store['bob'])

    def test_cannot_create_room_with_empty_name(self, chat_10, store):
        """A user shouldn't be able to create a room with an empty name"""
        with pytest.raises(ContractError) as e:
            chat_10('alice').create_room(room_name='')
        _assert_error(e, 'Room name cannot be empty.')

    def test_cannot_put_null_byte_in_message(self, chat_10, store):
        """When a user tries to send a null byte in a message, return an error."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        null_byte = chr(0)
        with pytest.raises(Exception) as e:
            chat_10('alice').send_message(room_channel=room, message=null_byte)
        assert 'send_message failed' in str(e.value)

    def test_cannot_put_null_byte_in_room_name(self, chat_10, store):
        """When a user tries to put a null byte into the room name, return an error."""
        null_byte = chr(0)
        with pytest.raises(Exception) as e:
            chat_10('alice').create_room(room_name=null_byte)
        assert 'create_room failed' in str(e.value)

    def test_room_visibility(self, store, chat_10):
        """After a user is invited they should be able to read messages from a room."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').invite_to_room(room_channel=room, new_member=store['bob'])
        chat_10('alice').send_message(room_channel=room, message='message')
        messages = chat_10('bob').get_messages(room_channel=room)
        utils.scrub_ids_and_timestamps(messages)
        assert messages == [{'sender': store['alice'], 'body': 'message'}]

    def test_user_removal(self, store, chat_10):
        """After a user is removed they should no longer be able to read new messages from a room."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').invite_to_room(room_channel=room, new_member=store['bob'])
        chat_10('alice').send_message(room_channel=room, message='yesbob')
        chat_10('alice').remove_from_room(room_channel=room, member_to_remove=store['bob'])
        chat_10('alice').send_message(room_channel=room, message='nobob')
        messages = chat_10('bob').get_messages(room_channel=room)
        utils.scrub_ids_and_timestamps(messages)
        assert messages == [{'sender': store['alice'], 'body':'yesbob'}]

    def test_delete_room(self, store, chat_10):
        """Once a room is deleted, no user can send messages to it."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').delete_room(room_channel=room)
        with pytest.raises(ContractError) as e:
            chat_10('alice').send_message(room_channel=room, message='message')
        _assert_error(e, f"Room {room} has been deleted. Cannot send message.")

    def test_cannot_get_messages_from_deleted_room(self, store, chat_10):
        """Once a room is deleted, no user can get messages from it."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').delete_room(room_channel=room)
        with pytest.raises(ContractError) as e:
            chat_10('alice').get_messages(room_channel=room)
        _assert_error(e, f"Room {room} has been deleted. Cannot get messages.")

    def test_deleted_room_not_included_in_get_rooms(self, store, chat_10):
        """Once a room is deleted, no user can get messages from it."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').delete_room(room_channel=room)
        rooms = chat_10('alice').get_rooms()
        assert (room not in [room['channel'] for room in rooms])

    def test_restore_room(self, store, chat_10):
        """After a room is restored, users can send messages to it again."""
        create_room_event = chat_10('alice').create_room(room_name='room')
        room = create_room_event['room']['channel']
        chat_10('alice').delete_room(room_channel=room)
        chat_10('alice').restore_room(room_channel=room)
        chat_10('alice').send_message(room_channel=room, message='message')

    def test_get_rooms(self, store, chat_10):
        chat_10('alice').create_room(room_name='room_1')
        chat_10('alice').create_room(room_name='room_2')
        rooms = chat_10('alice').get_rooms()
        utils.scrub_channels(rooms)
        assert rooms == [{'name': 'room_1', 'is_deleted': False, 'members': [store['alice']], 'owners':[store['alice']]},
                         {'name': 'room_2', 'is_deleted': False, 'members': [store['alice']], 'owners':[store['alice']]}]

    def test_get_rooms_change_after_person_left_and_promote_owner(self, network, store, chat_10):
        store['eve'] = network.register_key_alias()
        create_room_event = chat_10('alice').create_room(room_name='room')
        room=create_room_event["room"]["channel"]
        chat_10('alice').invite_to_room(new_member=store['bob'], room_channel=room)
        chat_10('alice').invite_to_room(new_member=store['eve'], room_channel=room)
        chat_10('alice').remove_from_room(member_to_remove=store['bob'], room_channel=room)
        chat_10('alice').promote_to_owner(member=store['eve'], room_channel=room)
        alice_rooms = chat_10('alice').get_rooms()
        bob_rooms = chat_10('bob').get_rooms()
        utils.scrub_channels(alice_rooms)
        utils.scrub_channels(bob_rooms)
        assert alice_rooms == [{'name': 'room', 'is_deleted': False, 'members': [store['alice'], store['eve']], 'owners':[store['alice'], store['eve']]}]
        assert bob_rooms == [{'name': 'room', 'is_deleted': False, 'members': [store['alice'], store['eve']], 'owners':[store['alice']]}]

    def test_demote_owner(self, store, chat_10):
        create_room_event = chat_10('alice').create_room(room_name='room')
        room=create_room_event["room"]["channel"]
        chat_10('alice').invite_to_room(new_member=store['bob'], room_channel=room)
        chat_10('alice').promote_to_owner(member=store['bob'], room_channel=room)
        rooms = chat_10('alice').get_rooms()
        utils.scrub_channels(rooms)
        assert rooms == [{'name': 'room', 'is_deleted': False, 'members': [store['alice'], store['bob']], 'owners':[store['alice'], store['bob']]}]
        chat_10('alice').demote_owner(owner=store['bob'], room_channel=room)
        rooms = chat_10('alice').get_rooms()
        utils.scrub_channels(rooms)
        assert rooms == [{'name': 'room', 'is_deleted': False, 'members': [store['alice'], store['bob']], 'owners':[store['alice']]}]

    def test_get_rooms_sorted_by_name(self, store, chat_10):
        chat_10('alice').create_room(room_name='room_0')
        chat_10('alice').create_room(room_name='room_1')
        chat_10('alice').create_room(room_name='room_2')
        chat_10('alice').create_room(room_name='room_3')
        chat_10('alice').create_room(room_name='room_4')
        chat_10('alice').create_room(room_name='room_5')
        rooms = chat_10('alice').get_rooms()
        assert rooms == sorted(rooms, key=lambda r: r['name'])

    def test_no_messages_over_4000_charts(self, store, chat_10):
        room = chat_10('alice').create_room(room_name='room')['room']['channel']
        message = "m" * 4001
        with pytest.raises(ContractError) as e:
            chat_10('alice').send_message(room_channel=room, message=message)
        _assert_error(e, 'Message cannot be longer than 4000 characters.')
