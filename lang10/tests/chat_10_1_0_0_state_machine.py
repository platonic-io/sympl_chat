from string import printable

from hypothesis import note
from hypothesis import assume
from hypothesis.stateful import Bundle, RuleBasedStateMachine, rule
import hypothesis.strategies as st

from assembly_client.api.types.error_types import ContractError

import model.chat_10_1_0_0_model as model

from utils.chat_10_1_0_0_test_utils import scrub_ids_and_timestamps

# global, non-resetting model
MODEL = None

# constant representing fatal termination states in the state machine
FATAL_ERROR = None

CHAT_VERSION = "10-1.0.0"


class ChatValidator(RuleBasedStateMachine):
    def __init__(self, network, is_regression_test=False):
        super(ChatValidator, self).__init__()

        # use a module-global `MODEL` variable to mimic a non-resetting network
        global MODEL
        if MODEL is None:
            MODEL = model.ChatModel()
        self.model = MODEL

        self.network = network  # note, no network reset here; this makes things faster
        self.is_regression_test = is_regression_test

    key_aliases = Bundle('key_aliases')
    room_channels = Bundle('room_channels')

    def note(self, s):
        if not self.is_regression_test:
            note(s)
        else:
            print(s)

    def try_and_catch(self, act):
        try:
            return act()
        except ContractError as e:
            self.note(e)
            return f"ChatError: {e.message}"

    def assert_results_match(self, method, caller, **kwargs):
        """Calls the method on both the network and the model, and ensures that their return values are the same."""
        network_result = self.try_and_catch(lambda: getattr(self.network[caller].chat[CHAT_VERSION], method)(**kwargs))
        model_result = self.try_and_catch(lambda: getattr(self.model, method)(caller, **kwargs))
        if isinstance(model_result, (list, )) and len(model_result) > 0 and 'message_id' in model_result[0]:
            assert scrub_ids_and_timestamps(model_result) == scrub_ids_and_timestamps(network_result)
        else:
            assert model_result == network_result
        return network_result

    # Each of these rules are changing the state of the state machine.
    # They will be randomly called by `hypothesis`, adhering to the rules provided.

    @rule(target=key_aliases)  # whatever this function returns, put it in `key_aliases`
    def key_alias(self):
        """Register a network identity."""
        return self.network.register_key_alias()

    # We need to pass the room_channel from the system to the model since the id generation is nondeterministic. That's
    # why this function does not simply use `assert_results_match` like all the others.
    @rule(creator=key_aliases, target=room_channels, room_name=st.text(printable))
    def create_room(self, creator, room_name):
        try:
            network_create_room_event = self.network[creator].chat[CHAT_VERSION].create_room(room_name=room_name)
            room_channel = network_create_room_event['room']['channel']
            model_create_room_event = self.model.create_room(creator, room_channel, room_name)
            print(network_create_room_event)
            print(model_create_room_event)
            assert network_create_room_event == model_create_room_event
            return room_channel
        except ContractError as network_error:
            print(f"network_result: {network_error.message}")
            try:
                # creation has failed on the network, so we're just checking error messages now.
                dummy_room_channel = None
                self.model.create_room(creator, dummy_room_channel, room_name)
            except ContractError as model_error:
                print(f"model_result: {model_error.message}")
                assert model_error.message == network_error.message

    @rule(sender=key_aliases, room_channel=room_channels, message=st.text(printable))
    def send_message(self, sender, room_channel, message):
        assume(room_channel != FATAL_ERROR)
        try:
            send_message_id = self.network[sender].chat[CHAT_VERSION].send_message(room_channel=room_channel,
                                                                                      message=message)
            message_id = send_message_id
            self.model.send_message(sender, room_channel, message, message_id, "")
        except ContractError as network_error:
            print(f"network_result: {network_error.message}")
            try:
                # sending has failed on the network, so we're just checking error messages now.
                dummy_message_id = None
                dummy_message_timestamp = None
                self.model.send_message(sender, room_channel, message, dummy_message_id, dummy_message_timestamp)
            except ContractError as model_error:
                print(f"model_result: {model_error.message}")
                assert model_error.message == model_error.message

    @rule(room_channel=room_channels, inviter=key_aliases, invitee=key_aliases)
    def invite_to_room(self, inviter, room_channel, invitee):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('invite_to_room', inviter, room_channel=room_channel, new_member=invitee)

    @rule(room_channel=room_channels, remover=key_aliases, removee=key_aliases)
    def remove_from_room(self, remover, room_channel, removee):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('remove_from_room',
                                         remover,
                                         room_channel=room_channel,
                                         member_to_remove=removee)

    @rule(room_channel=room_channels, getter=key_aliases)
    def get_messages(self, room_channel, getter):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('get_messages', getter, room_channel=room_channel)

    @rule(room_channel=room_channels, deleter=key_aliases)
    def delete_room(self, room_channel, deleter):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('delete_room', deleter, room_channel=room_channel)

    @rule(room_channel=room_channels, restorer=key_aliases)
    def restore_room(self, room_channel, restorer):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('restore_room', restorer, room_channel=room_channel)

    @rule(getter=key_aliases)
    def get_rooms(self, getter):
        return self.assert_results_match('get_rooms', getter)

    @rule(room_channel=room_channels, promoter=key_aliases, promotee=key_aliases)
    def promote_to_owner(self, promoter, room_channel, promotee):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('promote_to_owner', promoter, room_channel=room_channel, member=promotee)

    @rule(room_channel=room_channels, demoter=key_aliases, demotee=key_aliases)
    def demote_owner(self, demoter, room_channel, demotee):
        assume(room_channel != FATAL_ERROR)
        return self.assert_results_match('demote_owner', demoter, room_channel=room_channel, owner=demotee)