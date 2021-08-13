import { networkClient } from "./assembly-wrapper";
import Primus from "primus";

export const initialize_events = (primus : Primus) => {
    networkClient.nodeClients[0].on('*', (e) => {
        if(e.type.includes("Event")) {
            primus.write({
                "event": e.type,
                "data": e.data
            })
        }
    })

    primus.on('connection', (spark) => {
    
    })
}