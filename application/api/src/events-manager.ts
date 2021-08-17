import { networkClient } from "./assembly-wrapper";
import Primus, {Spark} from "primus";
import * as um from './user-manager';

const sparks = {}

export const initialize_events = (primus : Primus) => {
    networkClient.nodeClients[0].on('*', async (e) => {
        let event_meta = e.type.split('/');
        if(event_meta[event_meta.length-1].includes("Event")) {
            for(let member of e.data.room.members) {
                if(sparks[member]) {
                    for(let spark_id of sparks[member]) {
                        let spark : Spark = primus.spark(spark_id);
                        console.log(spark)
                        spark.write({
                            "type": e.type,
                            "data" : e.data
                        })
                    }
                }
            }
        }
    })/**/

    primus.on('connection', async (spark) => {
        spark.on('data', async (msg) => {

            //get the key alias associated with the user
            let key_alias = await um.get_ka_from_user(msg.data.username)
            
            //parse incoming messages from a connection
            switch(msg.type) {
                case "initial_message":
                    if(um.user_is_authorized(msg.data.username, spark.address.ip)) {
                        if(!sparks[key_alias]) {
                            sparks[key_alias] = [];
                        }
                        sparks[key_alias].push(spark.id);
                    }
                    break;
            }
        })
    })
}