import { expect } from "chai"
import { snakeCase } from "../../../src/util/StringUtils"

describe("StringUtils", () => {
    describe("snakeCase", () => {
        it("should convert camelcase to snakecase", () => {
            const input = "camelCaseStringHere"
            const expected = "camel_case_string_here"
            const actual = snakeCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should correctly convert an initial capital", () => {
            const input = "CamelCaseStringHere"
            const expected = "camel_case_string_here"
            const actual = snakeCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should correctly convert strings of capitals", () => {
            const input = "testABCItem"
            const expected = "test_abc_item"
            const actual = snakeCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should correctly convert repeating camelcase groups", () => {
            const input = "optionAOrB"
            const expected = "option_a_or_b"
            const actual = snakeCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should do nothing with strings that are already snakecase", () => {
            const expected = "snake_case_string_here"
            expect(snakeCase(expected)).to.be.equal(expected, expected)
        })

        it("should correctly convert mixed strings into snakecase", () => {
            const input = "optionAOr_BOr_C"
            const expected = "option_a_or_b_or_c"
            const actual = snakeCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should correctly convert strings with numbers", () => {
            const input = "device1Status"
            const expected = "device1_status"
            const actual = snakeCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should match the examples given in the older implementation", () => {
            // Pulled from https://regex101.com/r/QeSm2I/1
            const examples = {
                AbcItem: "abc_item",
                ABCItem: "abc_item",
                TestAbcItem: "test_abc_item",
                testABCItem: "test_abc_item",
                TestItemAbc: "test_item_abc",
                TestItemABC: "test_item_abc",
                abcItem: "abc_item",
            }

            for (const [input, expected] of Object.entries(examples)) {
                const actual = snakeCase(input)
                expect(actual).to.be.equal(
                    expected,
                    `Failed for Input: ${input}`,
                )
            }
        })
    })
})
