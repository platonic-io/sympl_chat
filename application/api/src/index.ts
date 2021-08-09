import * as fs from 'fs';
import * as contracts from '../@assembly/contract';
import { Chat } from '../@assembly/contract';
import Koa, {Context} from 'koa';
import Router from 'koa-router';
import mount from 'koa-mount';

//routes
import * as users from './routes/users';

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

const api : Koa = new Koa();
const api_router : Router = new Router();

api_router.get("/get_users", users.getUsers);
api_router.post("/create_user", users.createUser);

api.use(api_router.middleware())

app.use(mount('/api', api))

app.listen(8080);   


async function main() {
    const ka = await nodeClient.registerKeyAlias();
    console.log(ka);
}

main();
