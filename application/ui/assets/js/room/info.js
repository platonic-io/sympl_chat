let room_channel = window.location.hash.substr(1);
let page_room;

window.addEventListener("load", init);

async function init() {
  //just some checking to ensure the hash is an actual room
  if (/RID-[A-z0-9]{56}/g.exec(room_channel)) {
    let client_is_owner = false;
    await update_page_room();

    if (page_room !== undefined) {
      document.querySelector("#room-header").innerHTML = page_room.name;

      client_is_owner = page_room.owners.includes(localStorage.username);

      if (!client_is_owner) {
        document.querySelectorAll(".owners-only").forEach((el) => {
          el.remove();
        });
      }

      for (let member of page_room.members) {
        create_member_item(client_is_owner, member);
      }
    }

    if (client_is_owner) {
      call_api("GET", "get_users").then(async (users) => {
        for (let user of users.filter(
          (us) => !page_room.members.includes(us)
        )) {
          await create_user_item(client_is_owner, user);
        }
      });

      document.querySelector("#btn-delete").addEventListener("click", (e) => {
        call_api("POST", "delete_room", {
          room_channel: room_channel,
        }).then(async (response) => {
          if (!response.error) {
            let close_event = new CustomEvent("close", {});
            window.frameElement.parentElement.dispatchEvent(close_event);
            window.frameElement.parentElement.remove();
          }
        });
      });
    }
  } else {
    document.body.remove();
    window.location.href = "/room";
  }
}

async function create_user_item(client_is_owner, user) {
  let invite_list = document.querySelector("#invite-members");
  let user_item = document.createElement("div");
  user_item.className = "item";

  let user_label = document.createElement("p");
  user_label.innerHTML = get_friendly_contact_name(user);

  let user_add_button = document.createElement("button");
  user_add_button.innerHTML = "+";
  user_add_button.addEventListener("click", (e) => {
    call_api("POST", "invite_to_room", {
      room_channel: room_channel,
      new_member: user,
    }).then(async (response) => {
      if (!response.error) {
        await update_page_room();
        user_item.remove();
        await create_member_item(client_is_owner, user);
      } else {
        alert(`ERROR: ${response.error.error.message}`);
      }
    });
  });

  user_item.appendChild(user_label);
  user_item.appendChild(user_add_button);

  invite_list.appendChild(user_item);
}

async function update_page_room() {
  let rooms = await call_api("POST", "get_rooms");

  for (let room of rooms) {
    if (room.channel == room_channel) {
      page_room = room;
      break;
    }
  }
}

async function create_member_item(client_is_owner, member) {
  let member_item = document.createElement("li");
  let label = document.createElement("p");
  let btn_kick = document.createElement("button");
  let btn_promote = document.createElement("button");

  let owner = page_room.owners.includes(member);

  //define member item dom element
  member_item.id = member;
  member_item.className = "item";

  label.innerHTML = get_friendly_contact_name(member);
  member_item.appendChild(label);

  if (client_is_owner) {
    btn_promote.innerHTML = owner ? "Demote" : "Promote";
    btn_promote.value = member;
    btn_promote.addEventListener("click", (e) => {
      let person_key = owner ? "owner" : "member";

      let parameters = {
        room_channel: room_channel,
      };
      parameters[person_key] = member;

      call_api(
        "POST",
        owner ? "demote_owner" : "promote_to_owner",
        parameters
      ).then(async (response) => {
        if (!response.error) {
          await update_page_room();
          member_item.remove();
          create_member_item(client_is_owner, member);
        } else {
          alert(`ERROR: ${JSON.stringify(response, null)}`);
        }
      });
    });

    btn_kick.innerHTML = "Kick";
    btn_kick.value = member;
    btn_kick.addEventListener("click", (e) => {
      call_api("POST", "remove_from_room", {
        room_channel: room_channel,
        member_to_remove: member,
      }).then(async (response) => {
        if (!response.error) {
          await update_page_room();
          member_item.remove();
          if (client_is_owner) {
            await create_user_item(client_is_owner, member);
          }
        } else {
          alert(`ERROR: ${response}`);
        }
      });
    });

    member_item.appendChild(btn_promote);
    member_item.appendChild(btn_kick);
  }

  if (owner) {
    document.querySelector("#owners-container").appendChild(member_item);
  } else {
    document.querySelector("#members-container").appendChild(member_item);
  }
}
