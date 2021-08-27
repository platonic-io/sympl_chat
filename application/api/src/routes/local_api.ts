import * as userManager from "../user-manager";
import { Context } from "koa";
import { message_cache, updateCache } from "../message-cache";

export const getUsers = async function getUsers(ctx: Context) {
  ctx.body = await userManager.list_users();
};

export const createUser = async function createUser(ctx: Context) {
  if (ctx.request.query.username) {
    let username: string = ctx.request.query.username.toString();
    await userManager.create_user(username, ctx.request.ip);
    ctx.body = { username: ctx.request.query.username };
  } else {
    return Promise.reject(Error("No Username Supplied!"));
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
    message: await userManager.filter_out_ka(
      message_cache[room_channel][message_id]
    ),
  };
};
