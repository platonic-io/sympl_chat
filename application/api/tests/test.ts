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
import * as um from "../src/user-manager";
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
    await um.create_user("bob", "0.0.0.0");
    let ka = await um.get_ka_from_user("bob");
    chai.expect(ka).to.equal(demo_ka);
  });

  it("tests duplicate user", async () => {
    rks.returns(create_new_ka());
    await chai.expect(um.create_user("steve1", "0.0.0.0")).to.be.fulfilled;
    await chai
      .expect(um.create_user("steve1", "0.0.0.0"))
      .to.eventually.be.rejectedWith(Error);
  });

  it("tests getting username from key_alias", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    await um.create_user("bob", "0.0.0.0");
    let user = await um.get_user_from_ka(demo_ka);
    chai.expect(user).to.equal("bob");
  });

  it("tests user authorized", async () => {
    rks.returns(create_new_ka());
    await um.create_user("bob", "0.0.0.0");
    await expect(um.user_is_authorized("bob", "0.0.0.0")).to.eventually.be.true;
  });
  it("tests user unauthorized", async () => {
    rks.returns(create_new_ka());
    await um.create_user("bob", "0.0.0.1");
    await expect(um.user_is_authorized("bob", "0.0.0.0")).to.eventually.be
      .false;
  });
  it("tests user authorized (api route); authorization middleware", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    await um.create_user("bob", "0.0.0.0");
    let context: Context = create_new_context();
    context.request.headers["username"] = "bob";
    context.ip = "0.0.0.0";
    context.url = "/api/anything";
    await um.auth_middleware(context, () => {});
    expect(context.body).to.be.equal(undefined);
    expect(context.state.user).to.be.equal(demo_ka);
  });
  it("tests user unauthorized (ip); authorization middleware", async () => {
    rks.returns(create_new_ka());
    await um.create_user("bob", "0.0.0.1");
    let context: Context = create_new_context();
    context.request.headers["username"] = "bob";
    context.ip = "0.0.0.9";
    context.url = "/api/anything";
    await um.auth_middleware(context, () => {});
    //ensure the message comes back with an error
    expect(Object.keys(context.body)).to.include("error");
    expect(context.body["error"]["message"]).to.equal("Unauthorized Request!");
  });
  it("tests user unauthorized (username); authorization middleware", async () => {
    let context: Context = create_new_context();
    context.request.headers["username"] = "bob";
    context.ip = "0.0.0.9";
    context.url = "/api/anything";
    await um.auth_middleware(context, () => {});
    //ensure the message comes back with an error
    expect(Object.keys(context.body)).to.include("error");
    expect(context.body["error"]["message"]).to.equal("Unauthorized Request!");
    expect(context.state.user).to.be.undefined;
  });
  it("tests filter out key aliases from arbitray json", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    await um.create_user("bob", "0.0.0.0");
    let json_dummy_data = {};
    let json_swapped_data = {};
    json_dummy_data[demo_ka] = "test-data";
    json_swapped_data["bob"] = "test-data";
    json_dummy_data = await um.filter_out_ka(json_dummy_data);
    expect(json_dummy_data).to.eql(json_swapped_data);
  });
});

describe("Local Api Routes", async () => {
  beforeEach(() => {
    fs.writeFileSync("users.json", "{}");
  });
  it("tests creating a user", async () => {
    rks.returns(create_new_ka());
    let context: Context = create_new_context();
    context.request.query.username = "bob";
    context.request.ip = "0.0.0.0";
    //run the api
    await createUser(context);
    chai.expect(context.body["username"]).to.be.equal("bob");
  });

  it("tests getting multiple users", async () => {
    rks.returns(create_new_ka());
    await um.create_user("alice", "0.0.0.0");
    await um.create_user("bob", "0.0.0.0");
    await um.create_user("eve", "0.0.0.0");
    let context: Context = create_new_context();
    //run the api
    await getUsers(context);
    chai
      .expect(context.body)
      .to.be.an("array")
      .that.contains.something.like(["alice", "bob", "eve"]);
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
});

describe("Chat Middleware", async () => {
  beforeEach(() => {
    fs.writeFileSync("users.json", "{}");
  });

  it("tests filter usernames", async () => {
    let context = create_new_context();
    let demo_ka_1 = create_new_ka();
    rks.returns(demo_ka_1);
    await um.create_user("bob", "0.0.0.0");
    context.request.query["member_to_remove"] = "bob";
    context.request.query["room_channel"] = "RID-SHLDFHDSLFHDSFDSFDHSFHDSLFHDS";
    //run the function
    await api_middlewares.chat_filter_user(context, () => {});

    expect(context.state).to.eql({
      member_to_remove: demo_ka_1,
      room_channel: "RID-SHLDFHDSLFHDSFDSFDHSFHDSLFHDS",
    });
  });

  it("tests filter out ka from ctx.body", async () => {
    let demo_ka = create_new_ka();
    rks.returns(demo_ka);
    await um.create_user("bob", "0.0.0.0");
    let json_dummy_data = {};
    let json_swapped_data = {};
    json_dummy_data[demo_ka] = "test-data";
    json_swapped_data["bob"] = "test-data";
    let context = create_new_context();
    context.body = json_dummy_data;
    await api_middlewares.chat_filter_ka(context, () => {});
    expect(context.body).to.eql(json_swapped_data);
  });
});
