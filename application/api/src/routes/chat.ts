import Koa, {Context} from 'koa';
import { assembly_router } from './generated/chat';
import * as um from '../user-manager';

const assembly : Koa = new Koa();

assembly.use(async (ctx:Context, next: any) => {
    for(let key in JSON.parse((JSON.stringify(ctx.request.query)))) {
        ctx.state[key] = key.includes("owner") || key.includes("member") ? await um.get_ka_from_user(ctx.request.query[key]) : ctx.request.query[key];
    }
    return next();
})

assembly.use(async (ctx:Context, next: any) => {
    await next();
    let body_temp = ctx.body;
    if(body_temp.room) {
        body_temp.room["members"] = await Promise.all(body_temp.room["members"].map(
            async (ka) => await um.get_user_from_ka(ka)
        ))
    }
    ctx.body = body_temp;
    console.log(ctx.body);
})

assembly.use(assembly_router.middleware());


export const chat_routes : Koa = assembly;
