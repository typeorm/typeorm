import { expect } from "chai"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("driver > parseMysqlEnumValues", () => {
    it("reads simple values", () => {
        expect(DriverUtils.parseMysqlEnumValues("enum('a','b')")).to.eql([
            "a",
            "b",
        ])
    })

    it("keeps commas inside values", () => {
        expect(
            DriverUtils.parseMysqlEnumValues("enum('a,b','c, d','e')"),
        ).to.eql(["a,b", "c, d", "e"])
    })

    it("unescapes doubled quotes", () => {
        expect(
            DriverUtils.parseMysqlEnumValues("enum('Men''s','''quoted''','')"),
        ).to.eql(["Men's", "'quoted'", ""])
    })

    it("reads set values and parentheses", () => {
        expect(DriverUtils.parseMysqlEnumValues("set('(a)','b)')")).to.eql([
            "(a)",
            "b)",
        ])
    })
})
