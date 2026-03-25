import { expect } from "chai"
import { colors } from "../../src/lib/colors"

describe("colors", () => {
    it("should wrap text with bold escape codes", () => {
        expect(colors.bold("test")).to.equal("\x1b[1mtest\x1b[0m")
    })

    it("should wrap text with dim escape codes", () => {
        expect(colors.dim("test")).to.equal("\x1b[2mtest\x1b[0m")
    })

    it("should wrap text with red escape codes", () => {
        expect(colors.red("test")).to.equal("\x1b[31mtest\x1b[0m")
    })

    it("should wrap text with yellow escape codes", () => {
        expect(colors.yellow("test")).to.equal("\x1b[33mtest\x1b[0m")
    })

    it("should wrap text with blue escape codes", () => {
        expect(colors.blue("test")).to.equal("\x1b[94mtest\x1b[0m")
    })

    it("should handle empty strings", () => {
        expect(colors.bold("")).to.equal("\x1b[1m\x1b[0m")
    })
})
