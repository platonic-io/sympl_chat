async function init() {
  let users = await call_api("GET", "get_users");
  for (let user of users) {
    let friendly_name = get_friendly_contact_name(user);
    add_contact_item(user, friendly_name === user ? "" : friendly_name);
  }
}

function add_contact_item(key_alias, name = "") {
  let contacts_list_div =
    key_alias == localStorage.username
      ? document.querySelector("#current-user")
      : document.querySelector("#contacts-list");

  let new_contact = document.createElement("div");
  let ka_label = document.createElement("p");
  let input = document.createElement("input");
  let update_button = document.createElement("button");

  new_contact.style.display = "flex";
  new_contact.style.alignItems = "center";
  new_contact.classList.add("user-item");
  ka_label.classList.add("ka-label");
  ka_label.innerText = key_alias;

  if (contacts[key_alias]) {
    input.value = contacts[key_alias];
  }

  function update_contact() {
    call_api("POST", "update_contact", {
      key_alias: key_alias,
      contact_name: input.value,
    });
  }

  input.classList.add("inp-contact-name");
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      update_contact();
    }
  });

  update_button.classList.add("btn-update");
  update_button.innerText = "Update";
  update_button.addEventListener("click", update_contact);

  new_contact.appendChild(ka_label);
  new_contact.appendChild(input);
  new_contact.appendChild(update_button);

  contacts_list_div.appendChild(new_contact);
}

window.addEventListener("load", async () => {
  await init();
});
