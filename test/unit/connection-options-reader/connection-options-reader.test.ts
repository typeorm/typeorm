import { expect } from "chai"
import fs from "fs/promises"

import { ConnectionOptionsReader } from "../../../src/connection/ConnectionOptionsReader"
import type { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"
import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("ConnectionOptionsReader", () => {
    it("properly loads config with entities specified", async () => {
        type EntititesList = Function[] | string[]
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/class-entities",
        })
        const options: DataSourceOptions =
            await connectionOptionsReader.get("test-conn")
        expect(options.entities).to.be.an.instanceOf(Array)
        const entities: EntititesList = options.entities as EntititesList
        expect(entities.length).to.equal(1)
    })

    it("properly loads config with specified file path", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/test-path-config",
        })
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).to.have.string("/test-js")
    })

    it("properly loads asynchronous config with specified file path", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/test-path-config-async",
        })
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).to.have.string("/test-js-async")
    })

    it("properly loads config with specified file path from esm in js", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/test-path-config-esm",
        })
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).to.have.string("/test-js-esm")
    })

    it("should log warning when ormconfig file fails to load", async () => {
        // Create a malformed JS config file
        await fs.mkdir("./temp/configs", { recursive: true })
        await fs.writeFile(
            "./temp/configs/malformed-config.js",
            "module.exports = { invalid syntax here",
        )

        // Spy on logWarn
        const originalLogWarn = PlatformTools.logWarn
        let warnCalled = false
        let warnMessage = ""
        PlatformTools.logWarn = (...args: any[]) => {
            warnCalled = true
            warnMessage = args.join(" ")
        }

        try {
            const reader = new ConnectionOptionsReader({
                root: "./temp",
                configName: "configs/malformed-config",
            })
            await reader.all()
        } catch (err: any) {
            expect(err.message).to.include("No connection options were found")
        } finally {
            PlatformTools.logWarn = originalLogWarn
            await fs.unlink("./temp/configs/malformed-config.js")
        }

        expect(warnCalled).to.be.true
        expect(warnMessage).to.include("Could not load ormconfig file")
    })
})
