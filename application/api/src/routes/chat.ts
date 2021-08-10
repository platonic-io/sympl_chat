/*
import * as um from '../user-manager';
import { chat } from '../assembly-wrapper';
import { Room } from '@assembly/contract';
import Koa, { Context }  from 'koa';
import Router from 'koa-router';

const assembly : Koa = new Koa();
const assemblyRouter : Router = new Router();

assemblyRouter.post('/create_room', async (ctx: Context) => {
    ctx.body = await chat.createRoom(ctx.state.user, ctx.request.query.room_name);
})


export const assembly_api = assembly;
/**/
import Handlebars, { template } from 'handlebars';
import { chat } from '../assembly-wrapper';
import * as fs from 'fs';

Handlebars.registerHelper('underscore', (item : string) => {
    return item.toString().replace( /([A-Z])/g, "_$1").toLowerCase()
})

const assembly_routes = Handlebars.compile(fs.readFileSync(`${__dirname}/chat.ts.hbs`).toString())

let function_meta = {"functions" : []}

const chat_function_names = Object.getOwnPropertyNames(Object.getPrototypeOf(chat))
    .filter(func_name => func_name != "teardown" && func_name != "constructor");

const contract_definition = fs.readFileSync(`${__dirname}/../../@assembly/contract.js`).toString();

for(let i in chat_function_names) {    
    let name = chat_function_names[i];
    let regex = new RegExp(`async ${name}\\((.*)\\)`, 'g')
    console.log(regex)
    function_meta["functions"].push({
        "name" : chat_function_names[i], 
         parameters : [...contract_definition.matchAll(regex)][0][1].split(',')
                        .filter(param => param != "keyAlias")
                        .map(Function.prototype.call, String.prototype.trim)
    })
}

console.log(function_meta)
const template_chat_routes :string = assembly_routes(function_meta)

fs.writeFileSync(`${__dirname}/generated_chat.ts`, template_chat_routes);

import { assembly_api } from './generated_chat';
export const chat_routes = assembly_api;




