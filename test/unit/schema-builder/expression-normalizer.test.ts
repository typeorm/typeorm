import { expect } from "chai"
import { normalizeExpression } from "../../../src/schema-builder/util/constraintSignature"

describe("normalizeExpression", () => {
    it("trims leading and trailing whitespace", () => {
        expect(normalizeExpression("  price > 0  ")).to.equal("price > 0")
    })

    it("collapses internal whitespace runs to a single space", () => {
        expect(normalizeExpression("price   >    0")).to.equal("price > 0")
    })

    it("collapses tabs and newlines to a single space", () => {
        expect(normalizeExpression("price\t>\n0")).to.equal("price > 0")
    })

    it("strips a single layer of outer parens that wrap the entire expression", () => {
        expect(normalizeExpression("(price > 0)")).to.equal("price > 0")
    })

    it("strips multiple layers of outer parens iteratively", () => {
        expect(normalizeExpression("(((price > 0)))")).to.equal("price > 0")
    })

    it("does NOT strip parens when they do not wrap the entire expression", () => {
        expect(normalizeExpression("(a > 0) AND (b < 10)")).to.equal(
            "(a > 0) AND (b < 10)",
        )
    })

    it("does not lowercase SQL keywords — zero-false-positive policy", () => {
        expect(normalizeExpression("a > 0 AND b < 10")).to.equal(
            "a > 0 AND b < 10",
        )
        expect(normalizeExpression("a > 0 and b < 10")).to.equal(
            "a > 0 and b < 10",
        )
    })

    it("produces the same output for equivalent variants combining trim, whitespace, and parens", () => {
        const canonical = normalizeExpression("status = 'active'")
        const variants = [
            "status = 'active'",
            "  status  =  'active'  ",
            "(status = 'active')",
            "((  status   =   'active'  ))",
        ]
        for (const v of variants) {
            expect(normalizeExpression(v)).to.equal(
                canonical,
                `variant: ${JSON.stringify(v)}`,
            )
        }
    })

    it("handles empty and whitespace-only input", () => {
        expect(normalizeExpression("")).to.equal("")
        expect(normalizeExpression("   ")).to.equal("")
    })

    it("preserves the content of string literals verbatim", () => {
        expect(normalizeExpression("col = 'AND'")).to.not.equal(
            normalizeExpression("col = 'and'"),
        )
    })

    it("does not strip parens that start inside the expression", () => {
        expect(normalizeExpression("length(name) > 0")).to.equal(
            "length(name) > 0",
        )
    })
})
