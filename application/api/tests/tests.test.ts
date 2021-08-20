import * as um from '../src/user-manager'
import {expect, test, it, describe} from '@jest/globals';

describe('firsttest', () => {
    it("Create_User/Get_User", async () => {
        expect(await um.is_key_alias("jahlksdfjhalksdf")).toBe(false);
    })
})