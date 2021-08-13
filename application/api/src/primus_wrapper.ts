import Primus from 'primus';
import {networkClient, chat} from './assembly-wrapper';

networkClient.nodeClients[0].on('event', (e) => console.log("event!"))

export const create_primus = (server) : Primus => {
    const primus = new Primus(server, {
        transformer: "websockets"
    })
    
    primus.on('connection', function(spark) {
        spark.write({"hello":"world"});
    })

    networkClient.nodeClients[0].on('data', (e) => console.log("event!"))

    networkClient.nodeClients[0].on("error", (e) => {
        primus.write(e);
        console.log(e);
    })
    
    return primus;
}