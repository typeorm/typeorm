import { expect } from "chai"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("driver > parsePostgresArray", () => {
    it("parses an empty array", () => {
        expect(DriverUtils.parsePostgresArray("{}")).to.eql([])
    })

    it("parses unquoted elements", () => {
        expect(DriverUtils.parsePostgresArray("{a,b,1}")).to.eql([
            "a",
            "b",
            "1",
        ])
    })

    it("keeps commas inside quoted elements", () => {
        expect(DriverUtils.parsePostgresArray('{"a,b",c,"d, e"}')).to.eql([
            "a,b",
            "c",
            "d, e",
        ])
    })

    it("unescapes backslashes and double quotes", () => {
        expect(
            DriverUtils.parsePostgresArray('{"\\\\","\\"","\\\\\\""}'),
        ).to.eql(["\\", '"', '\\"'])
    })

    it("reads an unquoted NULL as null and a quoted one as a string", () => {
        expect(DriverUtils.parsePostgresArray('{NULL,"NULL",a}')).to.eql([
            null,
            "NULL",
            "a",
        ])
    })

    it("parses an empty quoted element", () => {
        expect(DriverUtils.parsePostgresArray('{"",a}')).to.eql(["", "a"])
    })
})
