import { expect } from "chai"
import { getConfig } from "../../src/dependencies"
import { config as v1Config } from "../../src/dependencies/v1"

describe("getConfig", () => {
    it("should return v1 config for version 'v1'", () => {
        expect(getConfig("v1")).to.equal(v1Config)
    })

    it("should return undefined for unknown version", () => {
        expect(getConfig("v99")).to.be.undefined
    })

    it("should return undefined for empty string", () => {
        expect(getConfig("")).to.be.undefined
    })
})
