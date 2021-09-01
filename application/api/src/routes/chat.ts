import Koa, { Context } from "koa";
import { assembly_router } from "./generated/chat";
const assembly: Koa = new Koa();

export const move_query_to_state = async (ctx: Context, next: any) => {
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
    ctx.state[key] = value;
  }
  return next();
};

assembly.use(move_query_to_state);

//the routes middleware for the assembly functions
assembly.use(assembly_router.middleware());

export const chat_routes: Koa = assembly;
