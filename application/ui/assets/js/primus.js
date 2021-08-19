var primus = new Primus('http://localhost:8081/primus', { websockets: true });

primus.on('open', () => {
    primus.write({ "type" : "initial_message", 
                   "data" : { "username": localStorage["username"] } 
                })
})

primus.on("data", async (data) => {
    if(data.event) {
        let event = data.event.split('/').pop()
        //When you receive a sendmessage event
        //get the message, then display it on the screen
        //if it is the correct message
        switch(event) {
            case "SendMessageEvent":
                get_message_and_add(data.data.message_id, data.data.room.channel)
                if(room_channel != data.data.room_channel) {
                    document.querySelector("#"  + data.data.room.channel ).classList.add("unread");
                }
                break;
            case "InviteToRoomEvent":
                add_message(`${data.data.inviter} added ${data.data.invitee}`, data.data.room.channel, false);
                if(![...document.querySelector("#room-items").children].map(e => e.id).includes(data.data.room.channel)) {
                    add_room(data.data.room);
                }
                break;
            case "RemoveFromRoomEvent":
                add_message(`${data.data.remover} removed ${data.data.removee}`, data.data.room.channel, false);
                break;
            case "DemoteOwnerEvent":
                add_message(`${data.data.demoter} demoted ${data.data.demotee}`, data.data.room.channel, false);
                break;
            case "PromoteToEvent":
                add_message(`${data.data.inviter} promoted ${data.data.invitee}`, data.data.room.channel, false);
                break;
            case "CreateRoomEvent":
                add_room(data.data.room);
                break;
            case "DeleteRoomEvent":
                document.querySelector(`#${data.data.room.channel}`).remove()
                //clear the screen of the old url
                window.location.hash = "";
                break;
        }
        
    }
})