import { expect } from "chai"
import fs from "fs/promises"
import path from "path"
import sinon from "sinon"

import { LoggerFactory } from "../../../src/logger/LoggerFactory"
import { importClassesFromDirectories } from "../../../src/util/DirectoryExportedClassesLoader"

describe("DirectoryExportedClassesLoader.importClassesFromDirectories", () => {
    const testDir = path.join(__dirname, "glob (chars) [x]")

    before(async () => {
        await fs.mkdir(testDir, { recursive: true })
        await fs.writeFile(
            path.join(testDir, "widget.cjs"),
            "module.exports.Widget = class Widget {}",
            "utf8",
        )
    })

    afterEach(() => sinon.restore())

    after(() => fs.rm(testDir, { recursive: true, force: true }))

    it("should load classes from an absolute pattern when the cwd has glob characters", async () => {
        sinon.stub(process, "cwd").returns(testDir)

        const classes = await importClassesFromDirectories(
            new LoggerFactory().create(),
            [`${testDir}/*.cjs`],
        )

        expect(classes.map((klass) => klass.name)).to.deep.equal(["Widget"])
    })
})
