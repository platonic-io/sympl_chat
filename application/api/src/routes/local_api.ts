import * as um from '../user-manager';
import { networkClient, chat } from '../assembly-wrapper';
import { Context } from 'koa';
import { message_cache, updateCache } from '../message-cache';

export const getUsers = async function getUsers(ctx: Context) {
    ctx.body = await um.list_users();
}

export const createUser = async function createUser(ctx: Context) {
    if(ctx.request.query.username) {   
        let un : string = ctx.request.query.username.toString();
        await um.create_user(un, ctx.request.ip);
        ctx.body = {"username":ctx.request.query.username};
    } else {
        throw new Error('No Username Supplied!');
   }
}

export const getMessage = async function get_message(ctx: Context) {
    if(!ctx.request.query.room_channel) {
        throw new Error('Missing room_channel in parameters list!')
    }
    if(!ctx.request.query.message_id) {
        throw new Error('Missing message_id in parameters list')
    }
    
    let room_channel = ctx.request.query.room_channel.toString();
    let message_id   = ctx.request.query.message_id.toString();

    if(!message_cache[room_channel] || !message_cache[room_channel][message_id]) {
        await updateCache(ctx.state.user, room_channel)
    }

    if(!message_cache[room_channel][message_id]) {
        throw new Error('Message does not exist');
    }

    ctx.body = {
        "message": await um.filter_out_ka(message_cache[room_channel][message_id])
    }
}