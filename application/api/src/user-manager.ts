import * as fs from "fs";
import { Context } from "koa";
import { networkClient, nodeClient } from "./assembly-wrapper";

const users_db_location = `${__dirname}/../users.json`;
const api_header = "/api";

//create the local "db" of usernames
//(it's just a json file)
if (!fs.existsSync(users_db_location)) {
  fs.writeFileSync(users_db_location, "{}");
} else {
  try {
    JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  } catch {
    fs.writeFileSync(users_db_location, "{}");
  }
}

//auth middleware
export const auth_middleware = async (ctx: Context, next: any) => {
  //if the user is unauthorized is an api method but not create_user/
  if (!ctx.url.includes("create_user")) {
    if (
      !(await user_is_authorized(ctx.get("username"), ctx.ip)) &&
      ctx.url.startsWith(api_header)
    ) {
      ctx.body = {
        error: { message: "Unauthorized Request!" },
      };
      return;
    }
  }

  if (
    ctx.url.startsWith(api_header) &&
    !ctx.url.startsWith(`${api_header}/create_user`)
  ) {
    //ctx.state.user becomes the key alias of the associated username
    //and is used in later middlewares, ctx.get('username') is
    //the username that the user understands
    ctx.state.user = await get_ka_from_user(ctx.get("username"));
  }
  return next();
};

/**
 * Checks if a given user is allowed
 * to make requests from a supplied IP address
 * @param user - username string
 * @param ip - connecting IP address
 * @returns boolean
 */
export const user_is_authorized = async function user_is_authorized(
  user: string,
  ip: string
): Promise<boolean> {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  if (user_db[user]) {
    return user_db[user]["ip"] == ip && user_db[user]["allowed"];
  }
  return false;
};

/**
 * creates a user
 * @param user - username string
 * @param ip - connecting IP address
 * @returns void
 */
export const create_user = async function create_user(
  ip: string
): Promise<string> {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  let user = await nodeClient.registerKeyAlias();
  if (user_db[user]) {
    return Promise.reject(new Error("Key alias already exists!?"));
  }
  user_db[user] = {
    ip: ip,
    ka: user,
    allowed: true,
    contacts: {},
  };
  fs.writeFileSync(users_db_location, JSON.stringify(user_db));
  return Promise.resolve(user);
};

/**
 * will get the key-alias string of a given user
 * @param user
 * @returns string
 */
export const get_ka_from_user = async function get_user_ka(
  user: string
): Promise<string> {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  if (await is_key_alias(user)) {
    return user;
  }
  if (!user_db[user]) {
    return Promise.reject(Error("User does not exist!"));
  }
  return user_db[user]["ka"];
};

/**
 * this function will return a username associated with a key alias
 * @param ka key alias
 * @returns username string
 */
export const get_user_from_ka = async function get_user_from_ka(
  ka: string,
  contacts_list_owner: string = "",
  suppress_error: boolean = true
): Promise<string> {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));

  for (let user of Object.keys(user_db)) {
    if (ka === user_db[user].ka) {
      return user;
    }
  }

  if (!suppress_error) {
    return Promise.reject(Error("KA not associated with a user!"));
  } else {
    return ka;
  }
};

/**
 * this function will get a list of users
 * @returns list string[] of users
 */
export const list_users = async function list_users(): Promise<string[]> {
  return Object.keys(JSON.parse(fs.readFileSync(users_db_location, "utf-8")));
};

/**
 * checks if a string is key alias format
 * @param ka key alias
 * @returns boolean
 */
export const is_key_alias = async function is_key_alias(
  ka: string
): Promise<boolean> {
  return Boolean(ka.match(/KA-[0-9]{16}/g));
};

/**
 * This function will delete a user from the stored users database
 * and deregister their key alias
 * @param user username of user to delete
 */
export const remove_user = async function remove_user(user: string) {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  if (!user_db[user]) {
    return Promise.reject(Error("Username does not exist!"));
  }
  let ka = user_db[user]["ka"];
  await nodeClient.deregisterKeyAlias(ka);
  user_db[user]["allowed"] = false;
  fs.writeFileSync(users_db_location, JSON.stringify(user_db));
};

export const add_contact = async function add_contact(
  user: string,
  contact_key_alias: string,
  contact_name: string
) {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  user_db[user].contacts[contact_key_alias] = contact_name;
  fs.writeFileSync(users_db_location, JSON.stringify(user_db));
};

export const remove_contact = async function remove_contact(
  user: string,
  contact_key_alias: string
) {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  delete user_db[user].contacts[contact_key_alias];
  fs.writeFileSync(users_db_location, JSON.stringify(user_db));
};

export const get_contacts = async function get_contacts(user: string) {
  let user_db = JSON.parse(fs.readFileSync(users_db_location, "utf-8"));
  return user_db[user].contacts ? user_db[user].contacts : [];
};
