import { expect } from "chai"
import fs from "fs/promises"
import path from "path"

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
            await fs.rm(testDir, { recursive: true })
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

        await fs.rm(testDir, { recursive: true })
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
            await fs.rm(testDir, { recursive: true })
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

        await fs.rm(testDir, { recursive: true })
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
            await fs.rm(testDir, { recursive: true })
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

        await fs.rm(testDir, { recursive: true })
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
            await fs.rm(testDir, { recursive: true })
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

        await fs.rm(testDir, { recursive: true })
    })

    it("should import .json file as CommonJS", async () => {
        const testDir = path.join(__dirname, "testJsonCommonJS")

        const jsonFilePath = path.join(testDir, "file.json")
        const jsonFileContent = { test: 6 }

        try {
            await fs.rm(testDir, { recursive: true })
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

        await fs.rm(testDir, { recursive: true })
    })
})
