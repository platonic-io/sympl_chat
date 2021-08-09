import * as um from '../user-manager';
import { networkClient, chat } from '../assembly-wrapper';
import { Context } from 'koa';

export const getUsers = async function getUsers(ctx: Context) {
    ctx.body = await um.list_users();
}

export const createUser = async function createUser(ctx: Context) {
    if(ctx.request.query.username) {   
        um.create_user(ctx.request.query.username, ctx.request.ip);
    } else {
        throw new Error('No Username Supplied!');
   }
}