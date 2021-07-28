from assembly.lang_8 import ContractError


class Message:
    def __init__(self, sender, body, message_id, message_timestamp):
        self.sender = sender
        self.body = body
        self.message_id = message_id
        self.message_timestamp = message_timestamp

    def as_data(self):
        return {
            'body': self.body, 'sender': self.sender, 'message_id': self.message_id, 'timestamp': self.message_timestamp
        }


class Room:
    def __init__(self, room_id, name, creator, channel):
        self.room_id = room_id
        self.name = name
        self.creator = creator
        self.messages = []
        self.members = [creator]
        self.owners = [creator]
        self.is_deleted = False
        self.channel = channel

    def add_message(self, body, sender, message_id, message_timestamp):
        self.messages.append(Message(sender, body, message_id, message_timestamp))

    def get_messages(self):
        return [message.as_data() for message in self.messages]

    def delete(self):
        self.is_deleted = True

    def restore(self):
        self.is_deleted = False

    def as_data(self):
        return {'name': self.name, 'is_deleted': self.is_deleted, 'members': self.members, 'owners': self.owners, 'channel': self.channel}


class CreateRoomEvent:
    def __init__(self, room):
        self.room = room

    def as_data(self):
        return {'room': self.room.as_data()}


class DeleteRoomEvent:
    def __init__(self, room):
        self.room = room

    def as_data(self):
        return {'room': self.room.as_data()}


class RestoreRoomEvent:
    def __init__(self, room):
        self.room = room

    def as_data(self):
        return {'room': self.room.as_data()}


class InviteToRoomEvent:
    def __init__(self, room, inviter, invitee):
        self.room = room
        self.inviter = inviter
        self.invitee = invitee

    def as_data(self):
        return {'room': self.room.as_data(), 'inviter': self.inviter, 'invitee': self.invitee}


class RemoveFromRoomEvent:
    def __init__(self, room, remover, removee):
        self.room = room
        self.remover = remover
        self.removee = removee

    def as_data(self):
        return {'room': self.room.as_data(), 'remover': self.remover, 'removee': self.removee}


class SendMessageEvent:
    def __init__(self, room, message):
        self.room = room
        self.message = message

    def as_data(self):
        return {'room': self.room.as_data(), 'message': self.message.as_data()}


class ChatModel:
    def __init__(self):
        self.rooms = {}

    def _get_room(self, getter, room_channel):
        def room_not_found():
            raise ContractError("Room for channel {} not found.".format(room_channel))

        if room_channel not in self.rooms:
            room_not_found()  # doesn't exist
        room = self.rooms[room_channel]
        if getter not in room.members:
            room_not_found()  # not visible, wrong channel
        return room

    def create_room(self, creator, room_channel, room_name):
        if room_name == '':
            raise ContractError("Room name cannot be empty.")
        if chr(0) in room_name:
            raise ContractError("Room name cannot contain null byte.")
        room = Room(room_channel, room_name, creator, room_channel)
        self.rooms[room_channel] = room
        return CreateRoomEvent(room).as_data()

    def invite_to_room(self, inviter, room_channel, new_member):
        room = self._get_room(inviter, room_channel)
        if new_member in room.members:
            raise ContractError("Member {} already in room {}.".format(new_member, room_channel))
        room.members.append(new_member)
        return InviteToRoomEvent(room, inviter=inviter, invitee=new_member).as_data()

    def remove_from_room(self, remover, room_channel, member_to_remove):
        room = self._get_room(remover, room_channel)
        if member_to_remove not in room.members:
            raise ContractError("Member {} not in room {}.".format(member_to_remove, room_channel))
        if member_to_remove == remover:
            raise ContractError("Cannot remove self from room.")
        room.members.remove(member_to_remove)
        return RemoveFromRoomEvent(room, remover=remover, removee=member_to_remove).as_data()

    def delete_room(self, deleter, room_channel):
        room = self._get_room(deleter, room_channel)
        if room.is_deleted:
            raise ContractError("Room {} already deleted.".format(room_channel))
        room.delete()
        return DeleteRoomEvent(room).as_data()

    def restore_room(self, restorer, room_channel):
        room = self._get_room(restorer, room_channel)
        if not room.is_deleted:
            raise ContractError("Room {} already active.".format(room_channel))
        room.restore()
        return RestoreRoomEvent(room).as_data()

    def send_message(self, sender, room_channel, message, message_id, message_timestamp):
        room = self._get_room(sender, room_channel)
        if room.is_deleted:
            raise ContractError("Room {} has been deleted. Cannot send message.".format(room_channel))
        if message == '':
            raise ContractError("Message cannot be empty.")
        if chr(0) in message:
            raise ContractError("Message cannot contain null byte.")
        room.add_message(message, sender, message_id, message_timestamp)
        return SendMessageEvent(room, Message(sender, message, message_id, message_timestamp))

    def get_messages(self, getter, room_channel):
        room = self._get_room(getter, room_channel)
        if room.is_deleted:
            raise ContractError("Room {} has been deleted. Cannot get messages.".format(room_channel))
        return room.get_messages()

    def get_rooms(self, getter):
        rooms = [room.as_data() for room in self.rooms.values() if getter in room.members and not room.is_deleted]
        return sorted(rooms, key=lambda room: (room['name'], room['channel']))
