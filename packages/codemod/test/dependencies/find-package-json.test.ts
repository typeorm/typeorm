import { expect } from "chai"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { findPackageJsonFiles } from "../../src/dependencies/find-package-json"

describe("findPackageJsonFiles", () => {
    let tmpDir: string

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codemod-find"))
    })

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true })
    })

    const mkdirp = (dir: string) => fs.mkdirSync(dir, { recursive: true })
    const touch = (file: string) => {
        mkdirp(path.dirname(file))
        fs.writeFileSync(file, "{}")
    }

    it("should find a direct package.json file path", () => {
        const file = path.join(tmpDir, "package.json")
        touch(file)

        const results = findPackageJsonFiles([file])

        expect(results).to.deep.equal([file])
    })

    it("should find package.json in a directory root", () => {
        touch(path.join(tmpDir, "package.json"))

        const results = findPackageJsonFiles([tmpDir])

        expect(results).to.have.length(1)
        expect(results[0]).to.equal(path.join(tmpDir, "package.json"))
    })

    it("should find package.json recursively in subdirectories", () => {
        touch(path.join(tmpDir, "package.json"))
        touch(path.join(tmpDir, "packages", "foo", "package.json"))
        touch(path.join(tmpDir, "packages", "bar", "package.json"))

        const results = findPackageJsonFiles([tmpDir])

        expect(results).to.have.length(3)
    })

    it("should find deeply nested package.json files", () => {
        touch(path.join(tmpDir, "a", "b", "c", "package.json"))

        const results = findPackageJsonFiles([tmpDir])

        expect(results).to.have.length(1)
        expect(results[0]).to.include(path.join("a", "b", "c"))
    })

    it("should exclude node_modules", () => {
        touch(path.join(tmpDir, "package.json"))
        touch(path.join(tmpDir, "node_modules", "foo", "package.json"))

        const results = findPackageJsonFiles([tmpDir])

        expect(results).to.have.length(1)
        expect(results[0]).to.not.include("node_modules")
    })

    it("should skip non-existent paths", () => {
        const results = findPackageJsonFiles([
            path.join(tmpDir, "does-not-exist"),
        ])

        expect(results).to.deep.equal([])
    })

    it("should ignore non-package.json files", () => {
        touch(path.join(tmpDir, "tsconfig.json"))

        const results = findPackageJsonFiles([tmpDir])

        expect(results).to.deep.equal([])
    })

    it("should deduplicate results", () => {
        const file = path.join(tmpDir, "package.json")
        touch(file)

        const results = findPackageJsonFiles([file, tmpDir])

        expect(results).to.have.length(1)
    })
})
