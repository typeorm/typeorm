import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { getMetadataArgsStorage } from "../../../src"
import { Foo } from "./entity/Foo"

describe("github issues > #5004 expireAfterSeconds 0 can't be passed to Index decorator", () => {
    it("should allow expireAfterSeconds 0 to be passed to Index decorator", () => {
        const metadataArgsStorage = getMetadataArgsStorage()
        const fooIndices = metadataArgsStorage.indices.filter(
            (indice) => indice.target === Foo,
        )

        expect(fooIndices.length).to.eql(1)
        expect(fooIndices[0].expireAfterSeconds).to.eql(0)
    })
})
