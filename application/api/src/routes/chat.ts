import Koa, { Context } from "koa";
import { assembly_router } from "./generated/chat";
import * as um from "../user-manager";
const assembly: Koa = new Koa();

export const chat_filter_user = async (ctx: Context, next: any) => {
  //swaps supplied 'usernames' for the associated key alias
  //from the users.json file
  for (let key in JSON.parse(JSON.stringify(ctx.request.query))) {
    //this is because the typescript type for request.query is string | string[]
    //and we can't assume that it's going to be a string
    let value: string =
      typeof ctx.request.query[key] === "string"
        ? ctx.request.query[key].toString()
        : ctx.request.query[key][0].toString();

    //set the value of ctx.state[key] to the value of ctx.request.query[key]
    //this makes the query parameters nice and easy for the auto generated
    //routes file.
    ctx.state[key] =
      key.includes("owner") || key.includes("member")
        ? await um.get_ka_from_user(value)
        : value;
  }
  return next();
};

assembly.use(chat_filter_user);

export const chat_filter_ka = async (ctx: Context, next: any) => {
  //replaces all 'key_aliases' from the return event in assembly
  //with the corresponding username stored in the users.json file. It uses
  //a regex to recognize the key aliases and then replaces them
  await next();
  let body_temp = JSON.stringify(ctx.body);
  if (body_temp !== undefined) {
    ctx.body = await um.filter_out_ka(ctx.body);
  }
};

assembly.use(chat_filter_ka);

//the routes middleware for the assembly functions
assembly.use(assembly_router.middleware());

export const chat_routes: Koa = assembly;
