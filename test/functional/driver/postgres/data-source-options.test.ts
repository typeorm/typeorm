import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
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
    after(() => closeTestingConnections(dataSources))

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
