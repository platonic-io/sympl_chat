import { networkClient } from "./assembly-wrapper";
import Primus, { Spark } from "primus";
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
                        if(spark === undefined) {
                            continue;
                        }
                        spark.write({
                            "event": e.type,
                            "data" : e.data
                        })
                    }
                }
            }
        }
    })/**/

    function monitor_sparks() {
        let s : string = "";
        primus.forEach(function (spark : any, next : any) {
            s += ` ${spark.id} ${spark.readyState}`
            spark.write("THIS IS A TEST")
            next();
        }, function(err) {
        })
        console.log(s);
        setTimeout(monitor_sparks, 1000)
    }
    monitor_sparks();

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

            let spark2 : Spark = primus.spark(spark.id);
            spark2.write({"data":"TEST"})
            spark.write({"data":"TEST"})
        })
    })
}