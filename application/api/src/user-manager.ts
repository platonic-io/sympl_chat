import { create } from 'domain';
import * as fs from 'fs';
import Koa, { Context, Request } from 'koa';
import {networkClient, chat} from './assembly-wrapper';

const users_db_location = `${__dirname}/../users.json`
const api_header = '/api'

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
    try {
        ctx.state.user = await get_ka_from_user(ctx.get('username'));
    } catch {

    }

    //if the user is unauthorized is an api but not create_user/
    if((!await user_is_authorized(ctx.get("username"), ctx.ip) && (ctx.url.startsWith(api_header))) && !ctx.url.includes("create_user"))  {
        ctx.body = {
            "error" : {"message" : "Unauthorized Request!"}
        }
        return;
    }
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
    return false;
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
export const get_ka_from_user = async function get_user_ka(user:string) : Promise<string> {
    let user_db = JSON.parse(fs.readFileSync(users_db_location, 'utf-8'));
    if(!user_db[user]) {
        throw new Error("User does not exist!");
    }
    return user_db[user]["ka"];
}

/**
 * this function will return a username associated with a key alias
 * @param ka key alias
 * @returns username string
 */
export const get_user_from_ka = async function get_user_from_ka(ka:string) : Promise<string> {
    let user_db = JSON.parse(fs.readFileSync(users_db_location, 'utf-8'));
    for(let user in user_db) {
        if(ka === user_db[user]["ka"]) {
            return user;
        }
    }
    throw new Error("KA not associated with a user!")
}

/**
 * this function will get a list of users
 * @returns list string[] of users
 */
export const list_users = async function list_users() : Promise<string[]> {
    return Object.keys(JSON.parse(fs.readFileSync(users_db_location, 'utf-8')))
}

/**
 * checks if a string is key alias format
 * @param ka key alias
 * @returns boolean
 */
export const is_key_alias = async function is_key_alias(ka: string) : Promise<boolean> {
    return Boolean(ka.match(/KA-[0-9]{16}/g))
}

/**
 * this will take a JSON object that contains key aliases
 * and return a JSON objec with the KA's swapped for their equivalent usernames
 * @param object JSON object to filter the ka
 * @returns JSON object
 */
export const filter_out_ka = async function filter_out_ka(object) : Promise<JSON> {
    let temp = JSON.stringify(object)
    let key_alias_regex = /KA-[0-9]{16}/g
    let kas = [...temp.matchAll(key_alias_regex)];

    for(let i = 0; i < kas.length; i++ ) {
        let username = (await get_user_from_ka(kas[i][0])).replaceAll('"', '\\"');
        temp = temp.replaceAll(kas[i][0], username);
    }
    return JSON.parse(temp);
}