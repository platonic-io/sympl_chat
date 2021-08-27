var primus = new Primus("/primus", { websockets: true });

primus.on("open", () => {
  primus.write({
    type: "initial_message",
    username: localStorage["username"],
  });
});

primus.on("data", async (data) => {
  if (data.event) {
    let event = data.event.split("/").pop();
    //When you receive a sendmessage event
    //get the message, then display it on the screen
    //if it is the correct message
    switch (event) {
      case "SendMessageEvent":
        get_message_and_add(data.data.message_id, data.data.room.channel);
        if (room_channel !== data.data.room.channel) {
          document
            .querySelector("#" + data.data.room.channel)
            .classList.add("unread");
        }
        break;
      case "InviteToRoomEvent":
        add_message(
          `${data.data.inviter} added ${data.data.invitee}`,
          data.data.room.channel,
          false
        );
        //if the room is not present in the list of rooms, then add it to the list of rooms
        if (
          ![...document.querySelector("#room-items").children]
            .map((e) => e.id)
            .includes(data.data.room.channel)
        ) {
          add_room(data.data.room);
        }
        //ensure the send button and textbox are visible if the person invited is currently looking
        //at the room. There's an instance where this is hidden if you are removed from a room you
        //are looking at.
        if (
          room_channel === data.data.room.channel &&
          data.data.invitee === localStorage.username
        ) {
          document.querySelector(
            "#send-message.room-specific"
          ).style.visibility = "visible";
        }
        break;
      case "RemoveFromRoomEvent":
        if (data.data.removee == localStorage.username) {
          add_message(
            `You have been removed from the room by ${data.data.remover}`,
            data.data.room.channel,
            false
          );
          document.querySelector(
            "#send-message.room-specific"
          ).style.visibility = "hidden";
        } else {
          add_message(
            `${data.data.remover} removed ${data.data.removee}`,
            data.data.room.channel,
            false
          );
        }
        break;
      case "DemoteOwnerEvent":
        add_message(
          `${data.data.demoter} demoted ${data.data.demotee}`,
          data.data.room.channel,
          false
        );
        break;
      case "PromoteToOwnerEvent":
        add_message(
          `${data.data.promoter} promoted ${data.data.promotee}`,
          data.data.room.channel,
          false
        );
        break;
      case "CreateRoomEvent":
        add_room(data.data.room);
        break;
      case "DeleteRoomEvent":
        document.querySelector(`#${data.data.room.channel}`).remove();
        //clear the screen of the old url
        window.location.hash = "";
        break;
    }
  }
});
