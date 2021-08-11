import Koa, {Context} from 'koa';
import { assembly_router } from './generated/chat';
import * as um from '../user-manager';

const assembly : Koa = new Koa();

assembly.use(async (ctx:Context, next: any) => {
    //this middleware swaps supplied 'usernames' for the associated key alias
    //from the users.json file
    for(let key in JSON.parse((JSON.stringify(ctx.request.query)))) {
        ctx.state[key] = key.includes("owner") || key.includes("member") ? await um.get_ka_from_user(ctx.request.query[key]) : ctx.request.query[key];
    }
    return next();
})

assembly.use(async (ctx:Context, next: any) => {
    //this middleware replaces all 'key_aliases' from the return event in assembly
    //with the corresponding username stored in the users.json file. It uses
    //a regex to recognize the key aliases and then replaces them
    await next();
    let body_temp = JSON.stringify(ctx.body);
    let key_alias_regex = /KA-[0-9]{16}/g
    let kas = [...body_temp.matchAll(key_alias_regex)];

    for(let i = 0; i < kas.length; i++ ) {
        let username = (await um.get_user_from_ka(kas[i][0])).replaceAll('"', '\\"');
        body_temp = body_temp.replaceAll(kas[i][0], username);
    }
    ctx.body = JSON.parse(body_temp);
})

//the routes middleware for the assembly functions
assembly.use(assembly_router.middleware());

export const chat_routes : Koa = assembly;
