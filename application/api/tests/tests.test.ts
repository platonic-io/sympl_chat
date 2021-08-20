import * as um from '../src/user-manager'
import {expect, test, it, describe} from '@jest/globals';

describe('key-alias-check', () => {
    it("tests-key-alias-function", async () => {
        expect(await um.is_key_alias("jahlksdfjhalksdf")).toBe(false);
    })
})

describe('key-alias-check', () => {
    it("tests-key-alias-function", async () => {
        expect(await um.is_key_alias("KA-2523277240480267")).toBe(true);
    })
})
