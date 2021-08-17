window.addEventListener('load', (e) => {
    document.querySelector('#btn-create-room').addEventListener('click', create_room)
    document.querySelector('#inp-room-title').addEventListener('keypress', (e) => {
        if (e.keyCode == 13) {
            create_room();
       }
    })
})

function create_room() {
    let room_name = document.querySelector('#inp-room-title').value;
    call_api("POST", "create_room", {
        "room_name" : room_name
    }).then( e => {
        console.log(e);
    })
}