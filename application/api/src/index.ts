import Koa, { Context } from "koa";
import Router from "koa-router";
import mount from "koa-mount";
import Primus from "primus";
import { auth_middleware } from "./user-manager";
import http from "http";
import * as fs from "fs";
import path from "path";
import { initialize_events } from "./events-manager";
//routes
import * as local_api from "./routes/local_api";
import { chat_routes } from "./routes/chat";
import { create_primus } from "./primus-wrapper";
import serve from "koa-static";

const PORT = 8081;

//overall koa app
const app: Koa = new Koa();

//error handling
app.use(async (ctx: Context, next: any) => {
  try {
    await next();
  } catch (e) {
    ctx.status = e.status || 500;
    ctx.body = { error: { message: e.message } };
    console.log(e);
  }
});

//create an http server instance to wrap the koa app
//and for use with Primus
let server_instance = http.createServer(app.callback());

//Koa app for the api
const api: Koa = new Koa();
const api_router: Router = new Router();

//local web-server specific routes
api_router.get("/get_users", local_api.getUsers);
api_router.post("/create_user", local_api.createUser);
api_router.post("/get_message", local_api.getMessage);
api_router.post("/get_contacts", local_api.getContacts);
//mount both local assembly routes to api
api.use(api_router.middleware());
api.use(mount("/", chat_routes)); //routes that go to assembly

const primus: Primus = create_primus(server_instance);
initialize_events(primus);

//Middleware Flow
app.use(auth_middleware); //check if user is authenticated then redirect
app.use(mount("/api", api));

//serve the ui
app.use(mount("/", serve(path.join(__dirname, "../../ui"))));

server_instance.listen(PORT, () => {
  console.log(`Server listening at: http://localhost:${PORT}`);
});

fs.writeFileSync(`${__dirname}/static/primus.js`, primus.library());
