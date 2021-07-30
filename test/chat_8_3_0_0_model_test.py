import pytest

from hypothesis import settings
from chat_8_3_0_0_state_machine import ChatValidator
from assembly.lang_8 import ContractRef

settings_profile = 'chat_model_test'
settings.register_profile(settings_profile, deadline=None)
settings.load_profile(settings_profile)


def set_up_network(network):
    network.upgrade_protocol(sympl_version=8)
    chat = ContractRef('chat', '3.0.0', 8)
    network.publish([chat])


@pytest.mark.usefixtures('network', 'store', 'state')
class TestRegTests:
    @pytest.fixture(scope="function")
    def state(self, network):
        state = ChatValidator(network, is_regression_test=True)
        yield state
        state.teardown()

    def test_network_setup(self, network):
        set_up_network(network)

    def test_create_room(self, state):
        creator = state.key_alias()
        state.create_room(creator=creator, room_name='room_name')

    def test_null_byte_in_room_name(self, state):
        creator = state.key_alias()
        state.create_room(creator=creator, room_name='\x00')

    def test_restore_non_deleted_room(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='room_name')
        state.restore_room(room, restorer=u1)

    def test_delete_deleted_room(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='room_name')
        state.delete_room(room, deleter=u1)
        state.delete_room(room, deleter=u1)

    def test_delete_room(self, state):
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        state.delete_room(deleter=creator, room_channel=room)

    def test_get_messages_from_new_room(self, state):
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        state.get_messages(getter=creator, room_channel=room)

    def test_get_messages_as_non_member(self, state):
        non_member = state.key_alias()
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        state.get_messages(getter=non_member, room_channel=room)

    def test_invite_self_to_room(self, state):
        v1 = state.key_alias()
        room = state.create_room(creator=v1, room_name='room_name')
        state.invite_to_room(invitee=v1, inviter=v1, room_channel=room)

    def test_remove_non_member(self, state):
        non_member = state.key_alias()
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        state.remove_from_room(removee=non_member, remover=creator, room_channel=room)

    def test_send_message_as_non_member(self, state):
        sender = state.key_alias()
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        state.send_message(message='message', room_channel=room, sender=sender)

    def test_remove_self_from_room(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='room_name')
        result = state.remove_from_room(removee=u1, remover=u1, room_channel=room)
        assert "Cannot remove self from room" in result

    def test_non_member_remove_self_from_room(self, state):
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        not_member = state.key_alias()
        state.remove_from_room(removee=not_member, remover=not_member, room_channel=room)

    def test_invite_to_room(self, state):
        inviter = state.key_alias()
        room = state.create_room(creator=inviter, room_name='room_name')
        invitee = state.key_alias()
        state.invite_to_room(invitee=invitee, inviter=inviter, room_channel=room)

    def test_invite_user_who_then_deletes_room(self, state):
        deleter = state.key_alias()
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        state.invite_to_room(invitee=deleter, inviter=creator, room_channel=room)
        state.delete_room(deleter=deleter, room_channel=room)

    def test_invite_user_to_room_twice(self, state):
        creator = state.key_alias()
        room = state.create_room(creator=creator, room_name='room_name')
        invitee = state.key_alias()
        state.invite_to_room(invitee=invitee, inviter=creator, room_channel=room)
        state.invite_to_room(invitee=invitee, inviter=creator, room_channel=room)

    def test_invite_user_who_then_removes_inviter(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='room_name')
        u2 = state.key_alias()
        state.invite_to_room(invitee=u2, inviter=u1, room_channel=room)
        state.remove_from_room(removee=u1, remover=u2, room_channel=room)

    def test_invite_as_non_owner(self, state):
        u1 = state.key_alias()
        u2 = state.key_alias()
        u3 = state.key_alias()
        room = state.create_room(creator = u1, room_name='rm1')
        state.invite_to_room(inviter=u1, invitee=u2, room_channel=room)
        state.invite_to_room(inviter=u2, invitee=u3, room_channel=room)

    def test_create_room_with_empty_name(self, state):
        creator = state.key_alias()
        state.create_room(creator=creator, room_name='')

    def test_empty_message(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='0')
        state.send_message(message='', room_channel=room, sender=u1)
        state.get_messages(getter=u1, room_channel=room)

    def test_send_empty_message_to_deleted_room(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='0')
        state.delete_room(deleter=u1, room_channel=room)
        state.send_message(message='', room_channel=room, sender=u1)

    def test_get_zero_rooms(self, state):
        u1 = state.key_alias()
        state.get_rooms(getter=u1)

    def test_get_one_room(self, state):
        u1 = state.key_alias()
        state.create_room(creator=u1, room_name='0')
        state.get_rooms(getter=u1)

    def test_create_and_delete_room(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='0')
        state.delete_room(deleter=u1, room_channel=room)

    def test_send_message(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='0')
        state.send_message(message='0', room_channel=room, sender=u1)

    def test_send_and_get_message(self, state):
        u1 = state.key_alias()
        room = state.create_room(creator=u1, room_name='0')
        state.send_message(message='0', room_channel=room, sender=u1)
        state.get_messages(getter=u1, room_channel=room)

    def test_promote_owner(self, state):
        inviter = state.key_alias()
        room = state.create_room(creator=inviter, room_name='room_name')
        invitee = state.key_alias()
        state.invite_to_room(invitee=invitee, inviter=inviter, room_channel=room)
        state.promote_to_owner(promoter=inviter, promotee=invitee, room_channel=room)

    def test_promote_owner_twice(self, state):
        inviter = state.key_alias()
        room = state.create_room(creator=inviter, room_name='room_name')
        invitee = state.key_alias()
        state.invite_to_room(invitee=invitee, inviter=inviter, room_channel=room)
        state.promote_to_owner(promoter=inviter, promotee=invitee, room_channel=room)
        state.promote_to_owner(promoter=inviter, promotee=invitee, room_channel=room)

    def test_demote_owner(self, state):
        inviter = state.key_alias()
        room = state.create_room(creator=inviter, room_name='room_name')
        invitee = state.key_alias()
        state.invite_to_room(invitee=invitee, inviter=inviter, room_channel=room)
        state.promote_to_owner(promoter=inviter, promotee=invitee, room_channel=room)
        state.demote_owner(demoter=invitee, demotee=inviter, room_channel=room)


@pytest.mark.usefixtures('network')
@pytest.mark.proptest
class TestPropertyTests:
    def test_network_setup(self, network):
        set_up_network(network)

    def test_chat_model(network, model_tester, hypothesis_settings):
        model_tester.run(ChatValidator, hypothesis_settings)
