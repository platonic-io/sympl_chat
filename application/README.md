# Sympl_Chat Application

The application server and can be started by going into the `api` directory and looking at the readme. The api also handles serving the GUI.

You can start the GUI provided you have both `sym` and `jq` installed. The application allows users to chat with each other in private rooms, and is based off the underlying logic of the Sympl_Chat example contract.

The purpose of this application is to have a basic example of how to build something on top of Assembly. It is not intended to be a production-ready application. 

# Usage:

Once the web server is up and running, you can navigate to `[localhost:8081](http://localhost:8081)` in your browser, and it will ask you to enter a username. Once you do so, you will enter the main chatroom screen. Select 'new room' at the top to create a chat room. Once you do this, you will see the chatroom show up on the left-hand side. Select this label on the left to choose the chatroom. From here you can send messages into the chatroom by typing in the input box at the bottom of the screen. However, this is no fun because you're there all by yourself! To add other users to the chatroom, select the `Info` button in the top right. Because you are an `owner` of the chatroom (anyone who creates a room is its owner by default), you can either add members or promote other members to be `owners` of the room.

# Definitions:

- Middleware → this refers to the web server written in typescript that abstracts assembly functions into usable application functions

# Design:

There are three levels to the design of the entire application: 

- UI - All the front-end user facing things
- Middleware - The web server that sits in between the UI and Assembly
- Assembly - The 'smart contract' written in Sympl

# Users

All `users` of the chat web-client are given their own unique identifier, called a `key_alias` (KA). This information is displayed on the main screen at `/room` at the top. In this chat room example, this KA can be thought of as a phone number. To add other users to your room, you need to also know their KA . However, because looking at random 16 digit numbers and quickly trying to understand who they belong to can prove challenging, there's an easy way to make these numbers human-readable by 'Updating Contacts' on the bottom left-hand side of the web interface. This will replace all references to a unique KA with the string you specified, but underneath, the KA is still the unique identifier. 

There are also two levels of users who can join a room: `members` and `owners`. Members have the ability solely to send and receive messages from the room, whereas owners have the ability to also manage the room (add people, remove people, add owners, delete the room, etc).

# Message History and Permissions

When you join a chatroom, you will be able to access all the messages that have ever been sent to a chatroom, and every new message sent while you are a member of the room. If you are removed from a room, you still will be able to view historical messages. However, going forward you will not receive any new message posted in the room. 

# Chat Functions

The actions that can be performed are all exposed by an api that is routed at `/api/<api_function_name>`. The UI makes use of these API calls to update information and get new information. They are listed below, with their parameters as sub bullets: 

All api routes should be called with the header:

`username = <user_key_alias>`

This specifies the person performing the action.

- `POST` create_room
    - `room_name` The name of the room you want to create
- `POST` delete_room
    - `room_channel` The Unique ID of the room
- `POST` restore_room - (unused in GUI)
    - `room_channel` The Unique ID of the room
- `POST` get_rooms - get all the rooms
- `POST` invite_to_room
    - `room_channel` The Unique ID of the room
    - `new_member` The member to be invited to the room
- `POST` remove_from_room
    - `room_channel` The Unique ID of the room
    - `member_to_remove` the person to remove from the room
- `POST` promote_to_owner
    - `room_channel` The Unique ID of the room
    - `member` - the current member of the room to become an owner
- `POST` demote_owner
    - `room_channel` The Unique ID of the room
    - `owner` the current owner to be demoted to member
- `POST` get_messages
    - `room_channel` The Unique ID of the room
- `POST` send_message
    - `room_channel` The Unique ID of the room
    - `message` The actual contents of the message to send
- `GET` get_users - gets all the users on across Assembly
- `POST` create_user
- `POST` get_message
    - `room_channel` The Unique ID of the room
    - `message_id` unique ID of the message
- `POST` get_contacts
- `POST` update_contact
    - `key_alias` the KA to add a contact name for
    - `contact_name` the contact name being added - an empty contact name here removes the contact from the contact list