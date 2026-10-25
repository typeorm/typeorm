import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { PlatformTools } from "../../../../src/platform/PlatformTools"
import { expect } from "chai"

describe("driver > postgres > DataSource options", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            driverSpecific: {
                applicationName: "some test name",
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should set session variable application_name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource.query(
                    "select current_setting('application_name') as application_name",
                )
                expect(result.length).equals(1)
                expect(result[0].application_name).equals("some test name")
            }),
        ))

    it("should not install custom extensions when none are specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource.query(
                    "SELECT extname FROM pg_extension WHERE extname IN ('tablefunc', 'xml2')",
                )
                expect(result.length).equals(0)
            }),
        ))
})

describe("driver > postgres > DataSource options > custom extension installation", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            driverSpecific: {
                extensions: ["tablefunc", "xml2"],
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.query("DROP EXTENSION IF EXISTS tablefunc")
                await dataSource.query("DROP EXTENSION IF EXISTS xml2")
            }),
        )
        await closeTestingConnections(dataSources)
    })

    it("should install specified extensions after connection", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const result = await dataSource.query(
                    "SELECT extname FROM pg_extension WHERE extname IN ('tablefunc', 'xml2')",
                )
                expect(result.length).equals(2)
                const installedExtensions = result.map((r: any) => r.extname)
                expect(installedExtensions).to.include("tablefunc")
                expect(installedExtensions).to.include("xml2")
            }),
        ))
})

describe("driver > postgres > DataSource options > queryStream", () => {
    const QueryStream = PlatformTools.load("pg-query-stream")
    let constructed = 0
    class CountingQueryStream extends QueryStream {
        constructor(...args: any[]) {
            super(...args)
            constructed++
        }
    }

    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            driverSpecific: {
                queryStream: CountingQueryStream,
            },
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should stream through the given pg-query-stream module", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const constructedBefore = constructed
                const stream = await dataSource
                    .createQueryBuilder()
                    .select("db.datname", "name")
                    .from("pg_database", "db")
                    .where("db.datname = current_database()")
                    .stream()
                const rows: unknown[] = []
                for await (const row of stream) rows.push(row)
                expect(rows).to.have.length(1)
                expect(constructed).equals(constructedBefore + 1)
            }),
        ))
})
