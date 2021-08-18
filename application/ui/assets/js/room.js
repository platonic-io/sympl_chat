
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

    document.querySelector("button#new-room").addEventListener('click',create_popup("/room/create"));

    room_change();
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
    let link = document.createElement("a")
    link.id = room.channel;
    link.href = `/room#${room.channel}`;
    link.innerHTML = room.name;
    document.querySelector("#room-items").appendChild(link);
} 

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

//add a message, if it is part of the correct room
//return true or false based on  whether the adding
//succeeded
function add_message(message, channel, sender=true) {
    if(channel === room_channel) {
        let msg_dom = document.createElement("p");
        if(sender) {
            msg_dom.innerHTML = `${message.sender}: ${message.body}`;
            msg_dom.id = message.message_id
        } else {
            msg_dom.innerHTML = message;
            msg_dom.style.class="msg-event"
        }
        document.querySelector("#messages").appendChild(msg_dom)
        let msg_list_dom = document.querySelector("#message-list-container")
        msg_list_dom.scrollTo(0, msg_list_dom.scrollHeight);
        return true;
    } else {
        return false;
    }
}

//load messages on screen, but break the loop
//if the messages were from a different room
function load_messages(channel) {
    if(channel) {
        document.querySelector("#messages").innerHTML = "";
        call_api("POST", "get_messages", { "room_channel" : channel} ).then(async  messages => {
            for(let message of messages) {
                if(!add_message(message, channel)) {
                    break;
                }
            }
        })
    }
}

function create_popup(src) {
    return (e) => {
        let info = document.createElement("div")
        info.style.position = "absolute";
        info.style.zIndex = 200;
        info.style.height = "75%"
        info.style.width = "75%"
        info.style.top = "12.5%"
        info.style.left = "12.5%"
        info.style.backgroundColor = "white"
        info.style.display = "flex";
        info.style.flexDirection = "column"
        info.id="iframe-popup"
        
        let button = document.createElement("button")
        button.innerHTML = 'X'
        button.addEventListener('click', (e) => {
            info.remove();
        })

        let link = document.createElement("iframe")
        link.style.flexGrow = "1"
        link.style.border = "none"
        link.src = src

        info.appendChild(button)
        info.appendChild(link)

        document.body.appendChild(info)
    }
}

var info_click_event_listener;

function room_change() {
    room_channel = window.location.hash.substr(1);
    load_messages(room_channel);

    if(info_click_event_listener) {
        document.querySelector("button#info").removeEventListener('click', info_click_event_listener)
    }
    info_click_event_listener = create_popup(`/room/info#${room_channel}`);
    document.querySelector("button#info").addEventListener('click', info_click_event_listener );
}

window.addEventListener('hashchange', () => {
    room_change();
})



window.addEventListener('load', () => {
    init();
})