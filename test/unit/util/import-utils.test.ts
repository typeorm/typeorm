import { expect } from "chai"
import fs from "fs/promises"
import path from "path"
import { strict as assert } from "assert"
import sinon from "sinon"
import fsAsync from "fs"
import Module from "module"

import { importOrRequireFile } from "../../../src/util/ImportUtils"

describe("ImportUtils.importOrRequireFile", () => {
    it("should import .js file as ESM", async () => {
        const testDir = path.join(__dirname, "testJsEsm")
        const srcDir = path.join(testDir, "src")

        const packageJsonPath = path.join(testDir, "package.json")
        const packageJsonContent = { type: "module" }

        const jsFilePath = path.join(srcDir, "file.js")
        const jsFileContent = `
            import path from "path";
            export default function test() {}
            export const number = 6;
        `

        try {
            await fs.rm(testDir, { recursive: true, force: true })
        } catch {
            // no-op
        }

        await fs.mkdir(srcDir, { recursive: true })

        await fs.writeFile(
            packageJsonPath,
            JSON.stringify(packageJsonContent),
            "utf8",
        )
        await fs.writeFile(jsFilePath, jsFileContent, "utf8")

        const [exports, moduleType] = await importOrRequireFile(jsFilePath)

        expect(exports).to.not.be.eq(null)
        expect(moduleType).to.be.eq("esm")
        expect(exports.default).to.be.a("function")
        expect(exports.number).to.be.eq(6)

        await fs.rm(testDir, { recursive: true, force: true })
    })

    it("should import .js file as CommonJS", async () => {
        const testDir = path.join(__dirname, "testJsCommonJs")
        const srcDir = path.join(testDir, "src")

        const packageJsonPath = path.join(testDir, "package.json")
        const packageJsonContent = {}

        const jsFilePath = path.join(srcDir, "file.js")
        const jsFileContent = `
            const path = require("path");
            module.exports = {
                test() {},
                number: 6
            };
        `

        try {
            await fs.rm(testDir, { recursive: true, force: true })
        } catch {
            // no-op
        }

        await fs.mkdir(srcDir, { recursive: true })

        await fs.writeFile(
            packageJsonPath,
            JSON.stringify(packageJsonContent),
            "utf8",
        )
        await fs.writeFile(jsFilePath, jsFileContent, "utf8")

        const [exports, moduleType] = await importOrRequireFile(jsFilePath)

        expect(exports).to.not.be.eq(null)
        expect(moduleType).to.be.eq("commonjs")
        expect(exports.test).to.be.a("function")
        expect(exports.number).to.be.eq(6)

        await fs.rm(testDir, { recursive: true, force: true })
    })

    it("should import .mjs file as ESM", async () => {
        const testDir = path.join(__dirname, "testMjsEsm")
        const srcDir = path.join(testDir, "src")

        const jsFilePath = path.join(srcDir, "file.mjs")
        const jsFileContent = `
            import path from "path";
            export default function test() {}
            export const number = 6;
        `

        try {
            await fs.rm(testDir, { recursive: true, force: true })
        } catch {
            // no-op
        }

        await fs.mkdir(srcDir, { recursive: true })

        await fs.writeFile(jsFilePath, jsFileContent, "utf8")

        const [exports, moduleType] = await importOrRequireFile(jsFilePath)

        expect(exports).to.not.be.eq(null)
        expect(moduleType).to.be.eq("esm")
        expect(exports.default).to.be.a("function")
        expect(exports.number).to.be.eq(6)

        await fs.rm(testDir, { recursive: true, force: true })
    })

    it("should import .cjs file as CommonJS", async () => {
        const testDir = path.join(__dirname, "testCjsCommonJs")
        const srcDir = path.join(testDir, "src")

        const jsFilePath = path.join(srcDir, "file.cjs")
        const jsFileContent = `
            const path = require("path");
            module.exports = {
                test() {},
                number: 6
            };
        `

        try {
            await fs.rm(testDir, { recursive: true, force: true })
        } catch {
            // no-op
        }

        await fs.mkdir(srcDir, { recursive: true })

        await fs.writeFile(jsFilePath, jsFileContent, "utf8")

        const [exports, moduleType] = await importOrRequireFile(jsFilePath)

        expect(exports).to.not.be.eq(null)
        expect(moduleType).to.be.eq("commonjs")
        expect(exports.test).to.be.a("function")
        expect(exports.number).to.be.eq(6)

        await fs.rm(testDir, { recursive: true, force: true })
    })

    it("should import .json file as CommonJS", async () => {
        const testDir = path.join(__dirname, "testJsonCommonJS")

        const jsonFilePath = path.join(testDir, "file.json")
        const jsonFileContent = { test: 6 }

        try {
            await fs.rm(testDir, { recursive: true, force: true })
        } catch {
            // no-op
        }

        await fs.mkdir(testDir, { recursive: true })

        await fs.writeFile(
            jsonFilePath,
            JSON.stringify(jsonFileContent),
            "utf8",
        )

        const [exports, moduleType] = await importOrRequireFile(jsonFilePath)

        expect(exports).to.not.be.eq(null)
        expect(moduleType).to.be.eq("commonjs")
        expect(exports.test).to.be.eq(6)

        await fs.rm(testDir, { recursive: true, force: true })
    })

    it("should fall back to import when the CommonJS loader cannot parse the file", async () => {
        // Vite based runners such as Vitest transform TypeScript for `import()` but leave
        // `require` on the plain CommonJS loader, which throws a SyntaxError on it.
        // https://github.com/typeorm/typeorm/issues/11570
        const testDir = path.join(__dirname, "testRequireFallsBackToImport")
        const srcDir = path.join(testDir, "src")

        const packageJsonPath = path.join(testDir, "package.json")
        const jsFilePath = path.join(srcDir, "file.js")
        const jsFileContent = `
            export default function test() {}
            export const number = 6;
        `

        await fs.rm(testDir, { recursive: true, force: true })
        await fs.mkdir(srcDir, { recursive: true })
        await fs.writeFile(packageJsonPath, JSON.stringify({}), "utf8")
        await fs.writeFile(jsFilePath, jsFileContent, "utf8")

        const extensions = (Module as any)._extensions
        const originalLoader = extensions[".js"]
        extensions[".js"] = (module: any, filename: string) => {
            if (filename === jsFilePath)
                throw new SyntaxError("Invalid or unexpected token")

            return originalLoader(module, filename)
        }

        try {
            const [exports, moduleType] = await importOrRequireFile(jsFilePath)

            expect(moduleType).to.be.eq("esm")
            expect(exports.default).to.be.a("function")
            expect(exports.number).to.be.eq(6)
        } finally {
            extensions[".js"] = originalLoader
            await fs.rm(testDir, { recursive: true, force: true })
        }
    })

    it("should keep the require error when importing does not help either", async () => {
        const testDir = path.join(__dirname, "testRequireErrorIsKept")
        const srcDir = path.join(testDir, "src")

        const packageJsonPath = path.join(testDir, "package.json")
        const jsFilePath = path.join(srcDir, "file.js")

        await fs.rm(testDir, { recursive: true, force: true })
        await fs.mkdir(srcDir, { recursive: true })
        await fs.writeFile(packageJsonPath, JSON.stringify({}), "utf8")
        await fs.writeFile(jsFilePath, "export const = 6", "utf8")

        const extensions = (Module as any)._extensions
        const originalLoader = extensions[".js"]
        extensions[".js"] = (module: any, filename: string) => {
            if (filename === jsFilePath)
                throw new SyntaxError("error thrown while requiring")

            return originalLoader(module, filename)
        }

        try {
            await importOrRequireFile(jsFilePath)
            expect.fail("importOrRequireFile should have thrown")
        } catch (error) {
            expect(error).to.be.instanceOf(SyntaxError)
            expect((error as SyntaxError).message).to.be.eq(
                "error thrown while requiring",
            )
        } finally {
            extensions[".js"] = originalLoader
            await fs.rm(testDir, { recursive: true, force: true })
        }
    })

    it("Should use cache to find package.json", async () => {
        // Create package.json if not exists
        const packageJsonPath = path.join(__dirname, "package.json")
        const packageJsonAlreadyExisted = fsAsync.existsSync(packageJsonPath)
        if (!packageJsonAlreadyExisted) {
            await fs.writeFile(
                packageJsonPath,
                JSON.stringify({ name: "test-package" }),
                "utf8",
            )
        }

        const statSpy = sinon.spy(fsAsync.promises, "stat")
        const readFileSpy = sinon.spy(fsAsync.promises, "readFile")

        assert.equal(
            statSpy.callCount,
            0,
            "stat should not be called before importOrRequireFile",
        )
        assert.equal(
            readFileSpy.callCount,
            0,
            "readFile should not be called before importOrRequireFile",
        )

        const filePath1 = path.join(__dirname, "file1.js")
        const filePath2 = path.join(__dirname, "file2.js")
        const filePath3 = path.join(__dirname, "file3.js")

        await fs.writeFile(filePath1, "", "utf8")
        await fs.writeFile(filePath2, "", "utf8")
        await fs.writeFile(filePath3, "", "utf8")

        // Trigger the first import to create the cache
        await importOrRequireFile(filePath1)

        // Get the number of calls to stat and readFile after the first import
        const numberOfStatCalls = statSpy.callCount
        const numberOfReadFileCalls = readFileSpy.callCount

        assert.equal(
            numberOfStatCalls,
            1,
            "stat should be called for the first import",
        )

        assert.equal(
            numberOfReadFileCalls,
            1,
            "readFile should be called for the first import",
        )

        // Trigger next imports to check if cache is used
        await importOrRequireFile(filePath2)
        await importOrRequireFile(filePath3)

        assert.equal(
            statSpy.callCount,
            numberOfStatCalls,
            "stat should be called only during the first import",
        )
        assert.equal(
            readFileSpy.callCount,
            numberOfReadFileCalls,
            "readFile should be called only during the first import",
        )

        // Clean up test files
        await fs.unlink(filePath1)
        await fs.unlink(filePath2)
        await fs.unlink(filePath3)

        // If package.json was created by this test, remove it
        if (!packageJsonAlreadyExisted) {
            await fs.unlink(packageJsonPath)
        }

        sinon.restore()
    })
})
