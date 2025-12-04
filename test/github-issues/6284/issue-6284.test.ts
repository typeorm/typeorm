import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { writeFile, unlink } from "fs/promises"
import { ConnectionOptionsReader } from "../../../src/connection/ConnectionOptionsReader"
import { importClassesFromDirectories } from "../../../src/util/DirectoryExportedClassesLoader"
import { LoggerFactory } from "../../../src/logger/LoggerFactory"
import { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"

describe("github issues > #6284 cli support for cjs extension", () => {
    it("will load a cjs file", async () => {
        const cjsConfigPath = [__dirname, "ormconfig.cjs"].join("/")
        const databaseType = "postgres"
        const config = `module.exports = {"type": "${databaseType}"};`
        let results: DataSourceOptions[]

        await writeFile(cjsConfigPath, config)
        try {
            const reader = new ConnectionOptionsReader({ root: __dirname })
            results = await reader.all()
        } finally {
            await unlink(cjsConfigPath)
        }

        expect(results).to.be.an("Array")
        expect(results[0]).to.be.an("Object")
        expect(results[0].type).to.equal(databaseType)
    })

    it("loads cjs files via DirectoryExportedClassesloader", async () => {
        const klassPath = [__dirname, "klass.cjs"].join("/")
        const klass = `module.exports.Widget = class Widget {};`
        let classes: Function[]

        await writeFile(klassPath, klass)
        try {
            classes = await importClassesFromDirectories(
                new LoggerFactory().create(),
                [`${__dirname}/*.cjs`],
            )
        } finally {
            await unlink(klassPath)
        }

        expect(classes).to.be.an("Array")
        expect(classes.length).to.eq(1)
    })
})
