import * as um from '../user-manager';
import { networkClient, chat } from '../assembly-wrapper';
import { Context } from 'koa';

export const getUsers = async function getUsers(ctx: Context) {
    ctx.body = await um.list_users();
}

export const createUser = async function createUser(ctx: Context) {
    if(ctx.request.query.username) {   
        let un : string = ctx.request.query.username.toString();
        try {
            um.create_user(un, ctx.request.ip);
            ctx.body = ctx.request.query.username;
        } catch (e) {
            throw e;
        }
    } else {
        throw new Error('No Username Supplied!');
   }
}