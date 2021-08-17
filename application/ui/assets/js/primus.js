var primus = new Primus('http://localhost:8081/primus', { websockets: true });

primus.on('open', () => {
    console.log("test")
    primus.write({ "type" : "initial_message", 
                   "data" : { "username": localStorage["username"] } 
                })
})

primus.on("data", async (data) => {
    if(data.event) {
        //When you receive a sendmessage event
        //get the message, then display it on the screen
        //if it is the correct message
        if(data.event.includes("SendMessageEvent")) {
            get_message_and_add(data.data.message_id, data.data.room.channel)
        }
    }
})


primus.on("reconnect", (data) => {
    console.log(data);
})
