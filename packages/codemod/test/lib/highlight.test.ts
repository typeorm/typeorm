import { expect } from "chai"
import { highlight } from "../../src/lib/highlight"

describe("highlight", () => {
    it("should replace backtick-wrapped content with dim formatting", () => {
        const result = highlight("use `prettier` to format")
        expect(result).to.include("prettier")
        expect(result).to.not.include("`")
    })

    it("should handle multiple backtick pairs", () => {
        const result = highlight("run `eslint --fix` or `prettier`")
        expect(result).to.not.include("`")
    })

    it("should leave text without backticks unchanged", () => {
        expect(highlight("no backticks here")).to.equal("no backticks here")
    })

    it("should handle empty string", () => {
        expect(highlight("")).to.equal("")
    })
})
