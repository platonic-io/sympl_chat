from hashlib import new
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
    def __init__(self, room, message_id):
        self.room = room
        self.message_id = message_id

    def as_data(self):
        return {'room': self.room.as_data(), 'message_id': self.message_id}

class PromoteToOwnerEvent:
    def __init__(self, room, promoter, promotee):
        self.room = room
        self.promoter = promoter
        self.promotee = promotee

    def as_data(self):
        return {'room': self.room.as_data(), 'promoter': self.promoter, 'promotee': self.promotee}

class DemoteOwnerEvent:
    def __init__(self, room, demoter, demotee):
        self.room = room
        self.demoter = demoter
        self.demotee = demotee

    def as_data(self):
        return {'room': self.room.as_data(), 'demoter': self.demoter, 'demotee': self.demotee}

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
        if inviter not in room.owners:
            raise ContractError(f"{inviter} is not an owner of the room {room.channel}.")
        if room.is_deleted:
            raise ContractError(f"{room.channel} is deleted.")

        room.members.append(new_member)
        return InviteToRoomEvent(room, inviter=inviter, invitee=new_member).as_data()

    def remove_from_room(self, remover, room_channel, member_to_remove):
        room = self._get_room(remover, room_channel)
        if member_to_remove not in room.members:
            raise ContractError("Member {} not in room {}.".format(member_to_remove, room_channel))
        if remover not in room.owners:
            raise ContractError(f"{remover} is not an owner and does not have permission to remove {member_to_remove} from room {room.channel}." )
        if room.is_deleted:
            raise ContractError(f"Room {room.channel} is deleted! Operation Denied.")
        if member_to_remove == remover:
            raise ContractError("Cannot remove self from room.")
        room.members.remove(member_to_remove)
        if member_to_remove in room.owners:
            room.owners.remove(member_to_remove)
        return RemoveFromRoomEvent(room, remover=remover, removee=member_to_remove).as_data()

    def delete_room(self, deleter, room_channel):
        room = self._get_room(deleter, room_channel)
        if room.is_deleted:
            raise ContractError("Room {} already deleted.".format(room_channel))
        if deleter not in room.members:
            raise ContractError(f'Member {deleter} does not belong to the room. Operation denied.')
        if deleter not in room.owners:
            raise ContractError(f"{deleter} is not an owner and does not have permission to delete the room.")
        room.delete()
        return DeleteRoomEvent(room).as_data()

    def restore_room(self, restorer, room_channel):
        room = self._get_room(restorer, room_channel)
 
        if not room.is_deleted:
            raise ContractError(f'Room {room_channel} already active.')
        if restorer not in room.members:
            raise ContractError(f'Member {restorer} does not belong to the room. Operation denied.')
        if restorer not in room.owners:
            raise ContractError(f"{restorer} is not an owner and does not have permission to restore the room.")
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
        return SendMessageEvent(room, message_id)

    def get_messages(self, getter, room_channel):
        room = self._get_room(getter, room_channel)
        if room.is_deleted:
            raise ContractError("Room {} has been deleted. Cannot get messages.".format(room_channel))
        return room.get_messages()

    def get_rooms(self, getter):
        rooms = [room.as_data() for room in self.rooms.values() if getter in room.members and not room.is_deleted]
        return sorted(rooms, key=lambda room: (room['name'], room['channel']))

    def promote_to_owner(self, promoter, room_channel, member):
        room = self._get_room(promoter, room_channel)
        if member not in room.members:
            raise ContractError(f"Member {member} is not in room {room_channel}.")
        if member in room.owners:
            raise ContractError(f"Member {member} is already an owner of room {room_channel}.")
        if room.is_deleted:
            raise ContractError(f'Room {room_channel} has been deleted. Cannot promote.')
        if promoter not in room.owners:
            raise ContractError(f'{promoter} is not an owner of the room. Operation denied.')

        room.owners.append(member)
        return PromoteToOwnerEvent(room=room, promoter=promoter, promotee=member).as_data()

    def demote_owner(self, demoter, room_channel, owner):
        room = self._get_room(demoter, room_channel)
        if owner not in room.members:
            raise ContractError(f'{owner} is not a member of room {room_channel}.')
        if demoter not in room.owners:
            raise ContractError(f'{demoter} is not an owner of the room. Operation denied.')
        if owner not in room.owners:
            raise ContractError(f"{owner} is not an owner of room {room_channel}. Cannot demote a non-owner.")
        if room.is_deleted:
            raise ContractError(f'Room {room_channel} has been deleted. Cannot demote.')
            #cannot leave zero owners in the room
    
        #cannot demote yourself
        if demoter == owner:
            raise ContractError(f"Cannot demote yourself!")
    
        room.owners.remove(owner)
        
        return DemoteOwnerEvent(room=room, demoter=demoter, demotee=owner).as_data()