let room_channel = window.location.hash.substr(1);
let page_room;

window.addEventListener('load', init)

function init() {
    //just some checking to ensure the hash is an actual room
    if(/RID-[A-z0-9]{56}/g.exec(room_channel)) {
        let user_is_owner = false;

        call_api("POST", "get_rooms").then(rooms => {

            for(let room of rooms) {
                if(room.channel == room_channel) {
                    page_room = room;
                    break;
                }
            }

            if(page_room !== undefined) {

                user_is_owner = page_room.owners.includes(localStorage.username);

                for(let member of page_room.members) {
                    let member_item = document.createElement('li');
                    let label = document.createElement('p');
                    let btn_kick = document.createElement('button');
                    let btn_promote = document.createElement('button');

                    let owner = page_room.owners.includes(member);
                    
                    if(owner) {
                        document.querySelector("#owners-container").appendChild(member_item);
                    } else {
                        document.querySelector("#owners-container").appendChild(member_item);
                    }

                    //define member item dom element
                    member_item.id = member;
                    member_item.className = "member_item";

                    label.innerHTML = member;
                    member_item.appendChild(label);
                    
                    if(user_is_owner) {
                        btn_promote.innerHTML = owner ? "Demote" : "Promote";
                        btn_promote.value = member;
                        btn_promote.addEventListener('click', (e) => {
                            let person_key = (owner ? "owner" :"member")
                            call_api("POST", 
                                owner ? "demote_owner" : "promote_to_owner",
                                {
                                    "room_channel" : room_channel,
                                    person_key : member
                                }                            
                            ).then(message => {
                                console.log(message)
                            })
                        })

                        btn_kick.innerHTML = "Kick"
                        btn_kick.value = member;
                        btn_kick.addEventListener('click', (e) => {
                            call_api("POST", "remove_from_room", {
                                "member_to_remove" : member
                            }).then(message => {
                                copnsole.log(message)
                            })
                        })

                        member_item.appendChild(btn_promote);
                        member_item.appendChild(btn_kick);
                    }
                }
            }

            if(user_is_owner) {
                call_api("GET", "get_users").then((users) => {
                    for(let user of users) {
                        let invite_list = document.querySelector("#invite-members")
                        let non_member_item = document.createElement("div")
                        non_member_item.innerHTML = user
                        invite_list.appendChild(non_member_item)
                    }
                })
            }

        })
    }
}