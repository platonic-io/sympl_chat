import { create } from 'domain';
import * as fs from 'fs';
import Koa, { Context, Request } from 'koa';
import {networkClient, chat} from './assembly-wrapper';

const users_db_location = 'users.json'

if (!fs.existsSync(users_db_location)) {
    fs.writeFileSync(users_db_location, "{}")
} else {
    try {
        JSON.parse(fs.readFileSync(users_db_location, 'utf-8'))
    } catch {
        fs.writeFileSync(users_db_location, "{}")
    }
}

//auth middleware
export const auth_middleware = async (ctx: Context, next: any) => {
    if(false) {
        ctx.redirect('/login');
    }
    try {
        ctx.state.user = await get_user_ka(ctx.get('username'))
    } catch {}
    return next();
}

/**
 * Checks if a given user is allowed
 * to make requests from a supplied IP address
 * @param user - username string
 * @param ip - connecting IP address
 * @returns boolean
 */
export const user_is_authorized = async function user_is_authorized(user: string, ip: string) : Promise<boolean> {
    let user_db = JSON.parse(fs.readFileSync(users_db_location, 'utf-8'))
    if(user_db[user]) {
        return user_db[user]["ip"] == ip;
    }
    return true;
}

/**
 * creates a user
 * @param user - username string
 * @param ip - connecting IP address
 * @returns void
 */
export const create_user = async function create_user(user: string, ip: string) : Promise<void> {
    let user_db = JSON.parse(fs.readFileSync(users_db_location, 'utf-8'))
    if(user_db[user]) {
        throw new Error("Username already exists!");
    }
    user_db[user] = {
        "ip" : ip,
        "ka" : await networkClient.nodeClients[0].registerKeyAlias()
    }
    fs.writeFileSync(users_db_location, JSON.stringify(user_db));
    return;
}

/**
 * will get the key-alias string of a given user
 * @param user 
 * @returns string
 */
export const get_user_ka = async function get_user_ka(user:string) : Promise<string> {
    let user_db = JSON.parse(fs.readFileSync(users_db_location, 'utf-8'))
    if(!user_db[user]) {
        throw new Error("User does not exist!");
    }
    return user_db[user]["ka"];
}

/**
 * this function will get a list of users
 * @returns list string[] of users
 */
export const list_users = async function list_users() : Promise<string[]> {
    return Object.keys(JSON.parse(fs.readFileSync(users_db_location, 'utf-8')))
}
