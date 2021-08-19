import { networkClient, chat } from './assembly-wrapper';

//variable to hold the cache for the messages
export const message_cache = {
    "room_id" : { "message_id" : "message" }
}

export const updateCache = async function updateCache(ka: string, room_channel: string) : Promise<void> {
    message_cache[room_channel] = {}
    let messages = await chat.getMessages(ka, room_channel);
    console.log("----messages---->");
    console.log(messages);
    console.log("<----------------");
    for(let message of messages) {
        message_cache[room_channel][message.message_id] = message;
    }
}