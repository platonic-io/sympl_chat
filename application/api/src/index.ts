import Koa, {Context} from 'koa';
import Router from 'koa-router';
import mount from 'koa-mount';
import Primus from 'primus';
import { auth_middleware } from './user-manager'
import http from 'http';
import * as fs from 'fs';

//routes
import * as users from './routes/users';
import { chat_routes } from './routes/chat';
import { create_primus } from './primus_wrapper';

//overall koa app
const app : Koa = new Koa();

//create an http server instance to wrap the koa app
//and for use with Primus
let server_instance = http.createServer(app.callback());

//Koa app for the api
const api : Koa = new Koa();
const api_router : Router = new Router();

//local web-server specific routes
api_router.get("/get_users", users.getUsers);
api_router.post("/create_user", users.createUser);

//mount both local assembly routes to api
api.use(mount('/local', api_router.middleware()));
api.use(mount('/assembly', chat_routes)); //routes that go to assembly

const ui : Koa = new Koa();
const ui_router : Router = new Router();

var primus : Primus = create_primus(server_instance);

ui_router.get("/", (ctx: Context) => {
    ctx.body = `
        <head> </head>
        <script>
        ${primus.library()}
        </script>
        <script defer>
        var primus = new Primus('http://localhost:8081/primus', {websockets: true});
        </script>
        <body></body>
    `
})
ui.use(ui_router.middleware())

//Middleware Flow
app.use(auth_middleware);     //check if user is authenticated then redirect
app.use(mount('/api', api)); 
app.use(mount('/', ui));

server_instance.listen(8081);

fs.writeFileSync(`${__dirname}/static/primus.js`, primus.library())