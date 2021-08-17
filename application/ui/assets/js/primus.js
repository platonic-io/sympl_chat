var primus = new Primus('http://localhost:8081/primus', { websockets: true });

primus.on('open', () => {
    console.log("test")
    primus.write({ "type" : "initial_message", 
                   "data" : { "username": localStorage["username"] } 
                })
})

primus.on("data", (data) => {
    if(data.event) {
        console.log(data.event)
        //When you receive a sendmessage event
        //get the message, then display it on the screen
        //if it is the correct message
        if(data.event.includes("SendMessageEvent")) {
                call_api("POST", "get_message", {
                    "message_id" : data.data.message_id, 
                    "room_channel": data.data.room.channel
                }).then(message => {
                    add_message(message.message, data.data.room.channel);
                })
        }
    }
})
