import { expect } from "chai"
import fs from "fs/promises"

import { ConnectionOptionsReader } from "../../../src/connection/ConnectionOptionsReader"
import { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"
import { PlatformTools } from "../../../src/platform/PlatformTools"

describe("ConnectionOptionsReader", () => {
    before(async () => {
        // These files may not always exist
        await fs.mkdir("./temp/configs", { recursive: true })
        await fs.writeFile(
            "./temp/configs/.env",
            "TYPEORM_CONNECTION = mysql\nTYPEORM_DATABASE = test-env",
        )
        await fs.writeFile(
            "./temp/configs/ormconfig.env",
            "TYPEORM_CONNECTION = mysql\nTYPEORM_DATABASE = test-ormconfig-env",
        )
    })

    afterEach(() => {
        delete process.env.TYPEORM_CONNECTION
        delete process.env.TYPEORM_DATABASE
    })

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

    it("properly loads sqlite in-memory/path config", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/sqlite-memory",
        })
        const inmemoryOptions: DataSourceOptions =
            await connectionOptionsReader.get("memory")
        expect(inmemoryOptions.database).to.equal(":memory:")
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).to.have.string("/test")
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

    it("properly loads config from .env file", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: "./temp",
            configName: "configs/.env",
        })
        const [fileOptions]: DataSourceOptions[] =
            await connectionOptionsReader.all()
        expect(fileOptions.database).to.have.string("test-env")
        expect(process.env.TYPEORM_DATABASE).to.equal("test-env")
    })

    it("properly loads config from ormconfig.env file", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: "./temp",
            configName: "configs/ormconfig.env",
        })
        const [fileOptions]: DataSourceOptions[] =
            await connectionOptionsReader.all()
        expect(fileOptions.database).to.have.string("test-ormconfig-env")
        expect(process.env.TYPEORM_DATABASE).to.equal("test-ormconfig-env")
    })

    it("properly loads config ormconfig.env when given multiple choices", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: "./temp/configs",
        })
        const [fileOptions]: DataSourceOptions[] =
            await connectionOptionsReader.all()
        expect(fileOptions.database).to.have.string("test-ormconfig-env")
        expect(process.env.TYPEORM_DATABASE).to.equal("test-ormconfig-env")
    })

    it("should log warning when ormconfig file fails to load", async () => {
        // Create a malformed JS config file
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
