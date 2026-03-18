import { expect } from "chai"
import { parseArgs } from "../../src/cli/parse-args"

describe("parseArgs", () => {
    it("should parse version as first positional argument", () => {
        const result = parseArgs(["v1", "src/"])
        expect(result.version).to.equal("v1")
        expect(result.paths).to.deep.equal(["src/"])
    })

    it("should parse --dry flag", () => {
        const result = parseArgs(["v1", "--dry", "src/"])
        expect(result.dry).to.be.true
    })

    it("should parse -d short flag", () => {
        const result = parseArgs(["v1", "-d", "src/"])
        expect(result.dry).to.be.true
    })

    it("should parse --list flag", () => {
        const result = parseArgs(["v1", "--list"])
        expect(result.list).to.be.true
    })

    it("should parse -l short flag", () => {
        const result = parseArgs(["v1", "-l"])
        expect(result.list).to.be.true
    })

    it("should parse --transform option", () => {
        const result = parseArgs([
            "v1",
            "--transform",
            "rename-find-by-ids",
            "src/",
        ])
        expect(result.transform).to.equal("rename-find-by-ids")
        expect(result.paths).to.deep.equal(["src/"])
    })

    it("should parse -t short option", () => {
        const result = parseArgs(["v1", "-t", "rename-find-by-ids", "src/"])
        expect(result.transform).to.equal("rename-find-by-ids")
    })

    it("should collect multiple paths", () => {
        const result = parseArgs(["v1", "src/", "lib/", "app/"])
        expect(result.paths).to.deep.equal(["src/", "lib/", "app/"])
    })

    it("should return empty version when no args", () => {
        const result = parseArgs([])
        expect(result.version).to.equal("")
        expect(result.paths).to.deep.equal([])
    })

    it("should handle all options together", () => {
        const result = parseArgs([
            "v1",
            "-t",
            "my-transform",
            "--dry",
            "src/",
            "lib/",
        ])
        expect(result.version).to.equal("v1")
        expect(result.transform).to.equal("my-transform")
        expect(result.dry).to.be.true
        expect(result.paths).to.deep.equal(["src/", "lib/"])
    })
})
