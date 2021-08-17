
let room_channel = ''

function init() {
    room_channel = window.location.hash.substr(1);
    //initialize the list of rooms
    call_api("POST", "get_rooms").then(rooms=> {
        for(let room of rooms) {
            add_room(room);
        }
    })
    load_messages();

    window.scrollTo(0,0);

    //events 
    document.querySelector("#btn-send-message").addEventListener('click', send_message)
    document.querySelector("#inp-send-message").addEventListener('keypress', (e) => {
        if(e.keyCode == 13) {
            send_message(e);
        }
    })
}

var start, finsih
function send_message(e) {
    start = new Date();
    let input_element = document.querySelector("#inp-send-message")
    call_api("POST", "send_message", {
        "room_channel":room_channel, 
        "message":input_element.value
    })
    input_element.value = "";
}

function add_room(room) {
    let li = document.createElement("li");
    li.id = room.channel;
    let link = document.createElement("a")
    link.href = `/room#${room.channel}`;
    link.innerHTML = room.name;
    li.appendChild(link);
    document.querySelector("#room-items").appendChild(li);
} 

<<<<<<< HEAD
function get_message_and_add(message_id, room_channel) {
    call_api("POST", "get_message", {
        "message_id" : message_id, 
        "room_channel": room_channel
    }).then(message => {
        add_message(message.message,room_channel);
        // Do things here
        finish = new Date();
        var difference = new Date();
        difference.setTime(finish.getTime() - start.getTime());
        console.log( difference.getMilliseconds() );
    })
}

=======
>>>>>>> a863f7a6800c1c6f787bc1bf7545fc1930c8b32e
function add_message(message, channel) {
    if(channel === room_channel) {
        let msg_dom = document.createElement("p");
        msg_dom.innerHTML = `${message.sender}: ${message.body}`;
        msg_dom.id = message.message_id
        document.querySelector("#messages").appendChild(msg_dom)
        let msg_list_dom = document.querySelector("#message-list-container")
<<<<<<< HEAD
        msg_list_dom.scrollTo(0, msg_list_dom.scrollHeight);
=======
        msg_list_dom.scrollTo(0, msg_list_dom.clientHeight);
>>>>>>> a863f7a6800c1c6f787bc1bf7545fc1930c8b32e
    }
}

function load_messages() {
    if(room_channel) {
        document.querySelector("#messages").innerHTML = "";
        call_api("POST", "get_messages", { "room_channel" : room_channel} ).then( messages => {
            for(let message of messages) {
                add_message(message, room_channel);
            }
        })
    }       
}

window.addEventListener('hashchange', () => {
    room_channel = window.location.hash.substr(1);
    load_messages();
})

window.addEventListener('load', () => {
    init();
})