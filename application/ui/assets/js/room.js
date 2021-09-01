let room_channel = "";
let allowed_in_room = false;

if (!localStorage.unread) {
  localStorage.unread = [];
}

async function init() {
  room_channel = window.location.hash.substr(1);
  //initialize the list of rooms
  let response = await call_api("POST", "get_rooms");

  if (response.error) {
    console.log(response.error);
    return;
  }

  let rooms = response;
  for (let room of rooms) {
    add_room(room);
  }

  room_change();

  window.scrollTo(0, 0);
  //events
  document
    .querySelector("#btn-send-message")
    .addEventListener("click", send_message);
  document
    .querySelector("#inp-send-message")
    .addEventListener("keypress", (e) => {
      if (e.keyCode == 13) {
        send_message(e);
      }
    });

  //add the username text
  document.querySelector(
    "#label-username"
  ).innerHTML = `Welcome, <b>${get_friendly_contact_name(
    localStorage.username
  )}</b>`;

  document
    .querySelector("button#new-room")
    .addEventListener("click", create_popup("/room/create"));

  document
    .querySelector("button#btn-contacts")
    .addEventListener("click", create_popup("/contacts"));
}

function send_message(e) {
  let input_element = document.querySelector("#inp-send-message");
  call_api("POST", "send_message", {
    room_channel: room_channel,
    message: input_element.value,
  });
  input_element.value = "";
}

function add_room(room) {
  let link = document.createElement("a");
  link.id = room.channel;
  link.href = `/room#${room.channel}`;

  let text_label = document.createElement("p");
  text_label.textContent = room.name;
  link.appendChild(text_label);
  document.querySelector("#room-items").appendChild(link);
}

function get_message_and_add(message_id, room_channel) {
  call_api("POST", "get_message", {
    message_id: message_id,
    room_channel: room_channel,
  }).then((message) => {
    add_message(message.message, room_channel);
  });
}

/**
 * add a message to the window
 * @param {*} message - message content
 * @param {*} channel - room channel
 * @param {*} sender - true or false (this dictates whether the message is a notification about
 * the room or an actual message someone sent)
 * @returns true or false based on whether the message was added
 */
function add_message(message, channel, sender = true) {
  if (channel === room_channel) {
    let msg_dom = document.createElement("p");
    if (sender) {
      let p = document.createElement("p");
      p.textContent = `${message.body}`.replaceAll("&quot;", '"');
      p.id = message.message_id;
      p.style.display = "inline-block";
      p.classList.add("message");
      p.classList.add(
        message.sender === localStorage.username
          ? "user-message"
          : "other-message"
      );
      msg_dom.style.textAlign =
        message.sender === localStorage.username ? "right" : "left";
      msg_dom.value = message.sender;
      let msg_container = document.querySelector("#messages");
      if (msg_container.childNodes.length > 0) {
        if (
          msg_container.childNodes[msg_container.childNodes.length - 1]
            .value !== msg_dom.value
        ) {
          let user_label = document.createElement("p");
          user_label.textContent = get_friendly_contact_name(message.sender);
          msg_dom.appendChild(user_label);
        }
      } else {
        let user_label = document.createElement("p");
        user_label.textContent = get_friendly_contact_name(message.sender);
        msg_dom.appendChild(user_label);
      }
      msg_dom.appendChild(p);
    } else {
      msg_dom.textContent = message.replaceAll("&quot;", '"');
      msg_dom.style.class = "msg-event";
      msg_dom.style.textAlign = "center";
    }
    document.querySelector("#messages").appendChild(msg_dom);
    let msg_list_dom = document.querySelector("#message-list-container");
    msg_list_dom.scrollTo(0, msg_list_dom.scrollHeight);
    return true;
  } else {
    return false;
  }
}

//load messages on screen, but break the loop
//if the messages were from a different room
async function load_messages(channel) {
  if (channel) {
    document.querySelector("#messages").textContent = "";
    let response = await call_api("POST", "get_messages", {
      room_channel: channel,
    });
    if (response.error) {
      return false;
    }

    let messages = response;
    for (let message of messages) {
      if (!add_message(message, channel)) {
        break;
      }
    }
    return true;
  }
  return false;
}

/**
 * create a pop-up window on the room page from some
 * src that gets loaded into an iframe
 * @param {*} src
 * @returns function that creates the popup to add in the event_listener of a button
 */
function create_popup(src) {
  return (e) => {
    let background_button = document.createElement("button");
    background_button.style.position = "absolute";
    background_button.style.width = "100vw";
    background_button.style.minHeight = "100vh";
    background_button.style.zIndex = 199;
    background_button.style.opacity = 0.75;
    background_button.style.top = 0;
    background_button.style.left = 0;
    background_button.style.backgroundColor = "black";
    background_button.style.border = "none";
    background_button.appendChild(document.createElement("p"));

    let link = document.createElement("iframe");
    link.style.flexGrow = "1";
    link.style.border = "none";
    link.src = src;

    let info = document.createElement("div");
    info.style.position = "absolute";
    info.style.zIndex = 200;
    info.style.height = "75%";
    info.style.width = "75%";
    info.style.top = "12.5%";
    info.style.left = "12.5%";
    info.style.backgroundColor = "#e7e7e7";
    info.style.display = "flex";
    info.style.flexDirection = "column";
    info.id = "iframe-popup";

    let button_container = document.createElement("div");
    button_container.style.display = "flex";
    button_container.style.justifyContent = "flex-end";
    button_container.style.minHeight = "25px";

    let button = document.createElement("button");
    button.textContent = "X";
    button.id = "close-button";
    button.style.width = "25px";

    function close() {
      info.remove();
      background_button.remove();
    }

    button.addEventListener("click", close);
    background_button.addEventListener("click", close);

    button_container.appendChild(button);

    info.appendChild(button_container);
    info.appendChild(link);

    info.addEventListener("close", (e) => {
      background_button.remove();
    });

    document.body.appendChild(background_button);
    document.body.appendChild(info);
  };
}

var info_click_event_listener;

//runs if a different room is selected
async function room_change() {
  room_channel = window.location.hash.substr(1);

  let rooms = await call_api("POST", "get_rooms");

  //get the room to see if the user is an actual member of the room
  if (!rooms.error) {
    for (let room of rooms) {
      if (room.channel === room_channel) {
        allowed_in_room = room.members.includes(localStorage.username);
      }
    }
  }

  //load messages into the selected room
  if (await load_messages(room_channel)) {
    document.querySelectorAll(".room-specific").forEach((el) => {
      el.style.visibility = "visible";
    });
    if (!allowed_in_room) {
      document.querySelector("#send-message.room-specific").style.visibility =
        "hidden";
      add_message("You were removed from this room!", room_channel, false);
    }
  } else {
    document.querySelectorAll(".room-specific").forEach((el) => {
      el.style.visibility = "hidden";
    });
  }

  //modify the element that is `selected` via the selected element class name
  document.querySelectorAll("#room-items a").forEach((element) => {
    element.classList.remove("selected-room");
    if (element.id === room_channel) {
      element.classList.add("selected-room");
    }
  });

  //remove the info button event (because now it needs to exist for
  //the currently selected room)
  if (info_click_event_listener) {
    document
      .querySelector("#btn-info")
      .removeEventListener("click", info_click_event_listener);
  }
  document.querySelector(`#${room_channel}`).classList.remove("unread");

  //add the event listener for clicking the info button
  info_click_event_listener = create_popup(`/room/info#${room_channel}`);
  document
    .querySelector("#btn-info")
    .addEventListener("click", info_click_event_listener);
  document.querySelector("#room-name").textContent = document.querySelector(
    `#${room_channel}`
  ).textContent;
}

window.addEventListener("hashchange", () => {
  room_change();
});

window.addEventListener("load", async () => {
  await init();
});
