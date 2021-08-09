import * as fs from 'fs';
import * as contracts from '../@assembly/contract';
import { Chat } from '../@assembly/contract';
import Koa, {Context} from 'koa';
import Router from 'koa-router';
import { exit } from 'process';

try {    
    var CONFIG = JSON.parse(fs.readFileSync('network_config.json', 'utf-8'));
}
catch (err) {
    console.log("No network-config.json found, using default connection parameters!")
}

const networkClient = contracts["ContractsClientFactory"].getInstance(CONFIG ? CONFIG : false)
const nodeClient = networkClient.nodeClients[0];
const chat : Chat = new contracts["Chat"](networkClient);

const app : Koa = new Koa();
const app_router : Router = new Router();

app_router.get('/create_ka', async (ctx : Context) => {
    ctx.body = await nodeClient.registerKeyAlias();
})

app_router.get("/list_ka", async (ctx: Context) => {
    ctx.body = await nodeClient.listKeyAliases();
})

app_router.get("/create_room/:caller/:room_name", async (ctx: Context) => {
    ctx.body = await chat.createRoom(ctx.params.caller, ctx.params.room_name);
})

app_router.get("/", async (ctx: Context, next: any) => {
    ctx.body = "<a href='/create_ka'>Create Ka </a><br><a href='/list_ka'>List Ka</a>"
    return next();
})


app.use(app_router.middleware())

app.listen(8080);   


async function main() {
    const ka = await nodeClient.registerKeyAlias();
    console.log(ka);
}

main();
