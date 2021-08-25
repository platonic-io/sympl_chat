import * as Mocha from 'mocha';
import * as Sinon from 'sinon';
import { networkClient, chat } from '../src/assembly-wrapper';
import * as um from '../src/user-manager'
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import * as acs from './assembly-client-stub';
import fs from 'fs';
chai.use(chaiAsPromised);

Sinon.stub(networkClient, "init").callsFake(() => {});
 
describe('User Tests', async () => {
    beforeEach( () => {
        fs.writeFileSync("users.json", "{}");
    })
    it("tests creating user", async () => {
        let rks = Sinon.stub(networkClient.nodeClients[0], "registerKeyAlias").returns("KA-111111");
        await um.create_user("bob", "0.0.0.0");
        let ka = await um.get_ka_from_user("bob");
        chai.expect(ka).to.equal("KA-111111");
        rks.restore();
    })

    it("tests duplicate user", async () => {
        let rks = Sinon.stub(networkClient.nodeClients[0], "registerKeyAlias").returns("KA-111111");
        await chai.expect(um.create_user("steve1", "0.0.0.0")).to.be.fulfilled;
        await chai.expect(um.create_user("steve1", "0.0.0.0")).to.eventually.be.rejectedWith(Error);
        rks.restore();
    })
})