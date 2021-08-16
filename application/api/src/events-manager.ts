import { networkClient } from "./assembly-wrapper";
import Primus from "primus";
import * as um from './user-manager';
import { updateCache } from "./message-cache";

export const initialize_events = (primus : Primus) => {
    networkClient.nodeClients[0].on('*', async (e) => {
        if(e.type.includes("Event")) {
            primus.write({
                "event": e.type,
                "data": await um.filter_out_ka(e.data)
            })
        }

        if(e.type.includes("SendMessageEvent")) {
            
        }


    })

    primus.on('connection', (spark) => {
    
    })
}