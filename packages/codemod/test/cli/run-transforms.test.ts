import { expect } from "chai"
import {
    DEFAULT_IGNORE_PATTERNS,
    buildIgnorePatterns,
} from "../../src/cli/run-transforms"

describe("run-transforms", () => {
    describe("DEFAULT_IGNORE_PATTERNS", () => {
        it("excludes ambient type declaration files by default", () => {
            expect(DEFAULT_IGNORE_PATTERNS).to.include("**/*.d.ts")
        })
    })

    describe("buildIgnorePatterns", () => {
        it("returns the defaults when no user patterns are supplied", () => {
            expect(buildIgnorePatterns()).to.deep.equal(DEFAULT_IGNORE_PATTERNS)
        })

        it("returns the defaults when user patterns are undefined", () => {
            expect(buildIgnorePatterns(undefined)).to.deep.equal(
                DEFAULT_IGNORE_PATTERNS,
            )
        })

        it("merges user patterns after the defaults so defaults are preserved", () => {
            const result = buildIgnorePatterns(["**/generated*", "**/e2e/**"])
            expect(result).to.deep.equal([
                ...DEFAULT_IGNORE_PATTERNS,
                "**/generated*",
                "**/e2e/**",
            ])
        })

        it("does not mutate the defaults when user patterns are provided", () => {
            const before = [...DEFAULT_IGNORE_PATTERNS]
            buildIgnorePatterns(["**/foo"])
            expect(DEFAULT_IGNORE_PATTERNS).to.deep.equal(before)
        })
    })
})
