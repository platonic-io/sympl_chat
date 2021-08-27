//wrap the assembly client into a module to standardize across the program
import * as fs from "fs";
import * as contracts from "../@assembly/contract";
import { Chat } from "../@assembly/contract";

//read the network config from the network_config.json file
//this is linked to the network_config in the ~/.symbiont folder
try {
  var CONFIG = JSON.parse(fs.readFileSync("network_config.json", "utf-8"));
} catch (err) {
  console.log(
    "No network-config.json found, using default connection parameters!"
  );
}

export const networkClient = contracts["ContractsClientFactory"].getInstance(
  CONFIG ? CONFIG : false
);
networkClient.init();
export const chat: Chat = new contracts["Chat"](networkClient);
