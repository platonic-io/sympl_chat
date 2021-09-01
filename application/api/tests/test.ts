import * as Mocha from "mocha";
import * as Sinon from "sinon";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";
import chaiThings from "chai-things";
import chaiLike from "chai-like";
import fs from "fs";
import { Context, Request } from "koa";
import { expect } from "chai";
//import applicaation modules
import { networkClient, chat } from "../src/assembly-wrapper";
import * as userManager from "../src/user-manager";
import { createUser, getMessage, getUsers } from "../src/routes/local_api";
import * as api_middlewares from "../src/routes/chat";
import { updateCache } from "../src/message-cache";
//use chai extensions
chai.use(chaiAsPromised);
chai.use(chaiThings);
chai.use(chaiLike);

Sinon.stub(networkClient, "init").callsFake(() => {});

function create_new_context(): Context {
  let obj = {} as Context;
  obj.request = {} as Request;
  obj.request.query = {};
  obj.request.headers = {};
  obj.state = {};
  obj["get"] = (str): string => {
    return obj.request.headers[str].toString();
  };
  return obj;
}

function create_new_ka() {
  let str = "";
  for (let i = 0; i < 16; i++) {
    str += Math.floor(Math.random() * 10).toString();
  }
  return `KA-${str}`;
}

let rks = Sinon.stub(networkClient.nodeClients[0], "registerKeyAlias").returns(
  create_new_ka()
);

describe("User Manager", async () => {
  beforeEach(() => {
    fs.writeFileSync("users.json", "{}");
  });
  it("tests creating user and getting key_alias", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    await userManager.create_user("0.0.0.0");
    let ka = await userManager.get_ka_from_user(demo_ka);
    chai.expect(ka).to.equal(demo_ka);
  });

  it("tests user authorized", async () => {
    rks.returns(create_new_ka());
    let user = await userManager.create_user("0.0.0.0");
    await expect(userManager.user_is_authorized(user, "0.0.0.0")).to.eventually
      .be.true;
  });
  it("tests user unauthorized", async () => {
    rks.returns(create_new_ka());
    let user = await userManager.create_user("0.0.0.1");
    await expect(userManager.user_is_authorized(user, "0.0.0.0")).to.eventually
      .be.false;
  });
  it("tests user authorized (api route); authorization middleware", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    let user = await userManager.create_user("0.0.0.0");
    let context: Context = create_new_context();
    context.request.headers["username"] = user;
    context.ip = "0.0.0.0";
    context.url = "/api/anything";
    await userManager.auth_middleware(context, () => {});
    expect(context.body).to.be.equal(undefined);
    expect(context.state.user).to.be.equal(demo_ka);
  });
  it("tests user unauthorized (ip); authorization middleware", async () => {
    rks.returns(create_new_ka());
    let user = await userManager.create_user("0.0.0.1");
    let context: Context = create_new_context();
    context.request.headers["username"] = user;
    context.ip = "0.0.0.9";
    context.url = "/api/anything";
    await userManager.auth_middleware(context, () => {});
    //ensure the message comes back with an error
    expect(Object.keys(context.body)).to.include("error");
    expect(context.body["error"]["message"]).to.equal("Unauthorized Request!");
  });
  it("tests user unauthorized (ka); authorization middleware", async () => {
    let context: Context = create_new_context();
    context.request.headers["username"] = "ahsdlfhakdhflad";
    context.ip = "0.0.0.9";
    context.url = "/api/anything";
    await userManager.auth_middleware(context, () => {});
    //ensure the message comes back with an error
    expect(Object.keys(context.body)).to.include("error");
    expect(context.body["error"]["message"]).to.equal("Unauthorized Request!");
    expect(context.state.user).to.be.undefined;
  });
});

describe("Local Api Routes", async () => {
  beforeEach(() => {
    fs.writeFileSync("users.json", "{}");
  });
  it("tests creating a user", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    let context: Context = create_new_context();
    context.request.ip = "0.0.0.0";
    //run the api
    let user = await createUser(context);
    chai.expect(context.body["username"]).to.be.equal(demo_ka);
  });

  it("tests getting no users", async () => {
    it("tests getting multiple users", async () => {
      let context: Context = create_new_context();
      //run the api
      await getUsers(context);
      chai
        .expect(context.body)
        .to.be.an("array")
        .that.contains.something.like([]);
    });
  });

  it("tests get message from message cache", async () => {
    let messages: any[] = [
      { message_id: "m1", message: "Hello " },
      { message_id: "m2", message: "World!" },
    ];

    Sinon.stub(chat, "getMessages").returns(
      new Promise<any[]>((res, rej) => {
        res(messages);
      })
    );
    await updateCache("KA-55555", "RID-99999");

    let context: Context = create_new_context();
    context.request.query["room_channel"] = "RID-99999";
    context.request.query["message_id"] = "m1";
    await getMessage(context);
    expect(context.body["message"]).to.eql({
      message_id: "m1",
      message: "Hello ",
    });
  });
  it("tests adding a contact", async () => {
    rks.callsFake(create_new_ka);
    let alice = await userManager.create_user("0.0.0.0");
    let bob = await userManager.create_user("0.0.0.0");
    await userManager.add_contact(alice, bob, "bob");
    let contacts = await userManager.get_contacts(alice);
    chai.expect(contacts[bob]).to.equal("bob");
  });
  it("tests removing a contact", async () => {
    rks.callsFake(create_new_ka);
    let alice = await userManager.create_user("0.0.0.0");
    let bob = await userManager.create_user("0.0.0.0");
    await userManager.add_contact(alice, bob, "bob");
    await userManager.remove_contact(alice, bob);
    let contacts = await userManager.get_contacts(alice);
    chai.expect(contacts[bob]).to.equal(undefined);
  });
  it("tests nonexistent a contact", async () => {
    rks.callsFake(create_new_ka);
    let alice = await userManager.create_user("0.0.0.0");
    let contacts = await userManager.get_contacts(alice);
    chai.expect(contacts["gibberish"]).to.equal(undefined);
  });
});

describe("Chat Middleware", async () => {
  beforeEach(() => {
    fs.writeFileSync("users.json", "{}");
  });

  it("tests moving query params to the state object", async () => {
    let context = create_new_context();
    let demo_ka_1 = create_new_ka();
    rks.returns(demo_ka_1);
    await userManager.create_user("0.0.0.0");
    context.request.query["member_to_remove"] = demo_ka_1;
    context.request.query["room_channel"] = "RID-SHLDFHDSLFHDSFDSFDHSFHDSLFHDS";
    //run the function
    await api_middlewares.move_query_to_state(context, () => {});

    expect(context.state).to.eql({
      member_to_remove: demo_ka_1,
      room_channel: "RID-SHLDFHDSLFHDSFDSFDHSFHDSLFHDS",
    });
  });
});
