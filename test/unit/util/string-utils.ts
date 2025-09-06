import { expect } from "chai"
import { camelCase, snakeCase, hash } from "../../../src/util/StringUtils"

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

    describe("camelCase", () => {
        it("should convert snakecase to camelcase", () => {
            const input = "camel_case_string_here"
            const expected = "camelCaseStringHere"
            const actual = camelCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should convert with first capital letter", () => {
            const input = "camel_case_string_here"
            const expected = "CamelCaseStringHere"
            const actual = camelCase(input, true)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should correctly convert repeating snakecase groups", () => {
            const input = "option_a_or_b_or_c"
            const expected = "optionAOrBOrC"
            const actual = camelCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })

        it("should do nothing with strings that are already camelcase", () => {
            const expected1 = "camelCaseStringHere"
            expect(camelCase(expected1)).to.be.equal(expected1, expected1)

            const expected2 = "CamelCaseStringHere"
            expect(camelCase(expected2, true)).to.be.equal(expected2, expected2)
        })

        it("should correctly convert strings with numbers", () => {
            const input = "device1_status"
            const expected = "device1Status"
            const actual = camelCase(input)

            expect(actual).to.be.equal(expected, `Failed for Input: ${input}`)
        })
    })

    describe("hash", () => {
        it("should return a SHA1 hash in hex format", () => {
            const result = hash("hello")
            // Precomputed SHA1 of "hello"
            expect(result).to.be.equal(
                "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
            )
            // Defensive checks against encoding/length regressions
            expect(result).to.have.lengthOf(40)
            expect(result).to.match(/^[0-9a-f]{40}$/)
        })

        it("should respect options.length and return truncated hash", () => {
            const result = hash("hello", { length: 8 })
            expect(result).to.be.equal("aaf4c61d") // first 8 chars of SHA1("hello")
        })

        it("should return full length hash if options.length is 0", () => {
            const result = hash("hello", { length: 0 })
            expect(result).to.be.equal(
                "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
            )
            expect(result).to.have.lengthOf(40)
        })

        it("should return full length hash if options.length is not provided", () => {
            const result = hash("world")
            // Precomputed SHA1 of "world"
            expect(result).to.be.equal(
                "7c211433f02071597741e6ff5a8ea34789abbf43",
            )
        })

        it("should handle empty string input", () => {
            const result = hash("")
            // Precomputed SHA1 of empty string
            expect(result).to.be.equal(
                "da39a3ee5e6b4b0d3255bfef95601890afd80709",
            )
        })

        it("should be deterministic (same input => same output)", () => {
            const input = "typeorm"
            const hash1 = hash(input)
            const hash2 = hash(input)
            expect(hash1).to.be.equal(hash2)
        })

        it("should ignore negative length and return full hash", () => {
            const full = "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"
            const result = hash("hello", { length: -5 as unknown as number })
            expect(result).to.be.equal(full)
        })

        it("should return full length when options.length exceeds digest size", () => {
            const full = hash("hello")
            const over = hash("hello", { length: 999 })
            expect(over).to.equal(full)
            expect(over).to.have.lengthOf(40)
        })
    })
})
