import * as fs from 'fs';
import * as contracts from '../@assembly/contract';
import { Chat } from '../@assembly/contract';

try {    
    var CONFIG = JSON.parse(fs.readFileSync('network_config.json', 'utf-8'));
}
catch (err) {
    console.log("No network-config.json found, using default connection parameters!")
}

export const networkClient = contracts["ContractsClientFactory"].getInstance(CONFIG ? CONFIG : false)
export const chat : Chat = new contracts["Chat"](networkClient);

