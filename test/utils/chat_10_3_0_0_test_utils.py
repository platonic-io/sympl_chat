"""
Test utilities for Chat
"""


def scrub_ids_and_timestamps(messages):
    for message in messages:
        del message['message_id']
        del message['timestamp']


def scrub_channels(rooms):
    for room in rooms:
        del room['channel']
