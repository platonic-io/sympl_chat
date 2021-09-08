import * as userManager from "../user-manager";
import { Context } from "koa";
import { message_cache, updateCache } from "../message-cache";
import { networkClient } from "../assembly-wrapper";

export const getUsers = async function getUsers(ctx: Context) {
  let user_list = (await networkClient.listKeyAliases())[0];
  ctx.body = await Promise.all(
    user_list.map(async (e) => {
      return await userManager.get_user_from_ka(e, ctx.get("username"), true);
    })
  );
};

export const createUser = async function createUser(ctx: Context) {
  let username = await userManager.create_user(ctx.request.ip);
  ctx.body = { username: username };
  if (ctx.request.query.username) {
    userManager.add_contact(
      username,
      username,
      ctx.request.query.username.toString()
    );
  }
};

export const getMessage = async function get_message(ctx: Context) {
  if (!ctx.request.query.room_channel) {
    return Promise.reject(Error("Missing room_channel in parameters list!"));
  }
  if (!ctx.request.query.message_id) {
    return Promise.reject(Error("Missing message_id in parameters list"));
  }

  let room_channel = ctx.request.query.room_channel.toString();
  let message_id = ctx.request.query.message_id.toString();

  //if the message or room does not exist in the message cache, then cache it!
  if (
    !message_cache[room_channel] ||
    !message_cache[room_channel][message_id]
  ) {
    await updateCache(ctx.state.user, room_channel);
  }

  if (!message_cache[room_channel][message_id]) {
    return Promise.reject(Error("Message does not exist"));
  }

  ctx.body = {
    message: message_cache[room_channel][message_id],
  };
};

export const getContacts = async function get_contacts(ctx: Context) {
  ctx.body = await userManager.get_contacts(ctx.get("username"));
};

export const updateContact = async function update_contact(ctx: Context) {
  if (!ctx.request.query.key_alias) {
    return Promise.reject(Error("Key Alias not supplied!"));
  }
  let key_alias = ctx.request.query.key_alias.toString();
  let contact_name = ctx.request.query.contact_name.toString();
  if (contact_name === "") {
    userManager.remove_contact(ctx.state.user, key_alias);
  } else {
    userManager.add_contact(ctx.state.user, key_alias, contact_name);
  }
  ctx.body = { message: "success!" };
};
