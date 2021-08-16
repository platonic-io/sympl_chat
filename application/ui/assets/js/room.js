
function init() {
    //initialize the list of rooms
    call_api("POST", "get_rooms").then(rooms=> {
        for(let room of rooms) {
            add_room(room);
        }
    })
    load_messages();
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

function add_message(message) {
    let msg_dom = document.createElement("p");
    msg_dom.innerHTML = `${message.sender}: ${message.body}`;
    document.querySelector("#messages").appendChild(msg_dom)
}

function load_messages() {
    if(window.location.hash) {
        let room_channel = window.location.hash.substr(1);
            call_api("POST", "get_messages", { "room_channel" : room_channel} ).then( messages => {
                for(let message of messages) {
                    add_message(message);
                }
            })
    }       
}

window.addEventListener('hashchange', () => {
    console.log(window.location.href);
    load_messages();
})

window.addEventListener('load', () => {
    init();
})