import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"

describe("driver > postgres > connection options", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                driverSpecific: {
                    applicationName: "some test name",
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should set session variable application_name", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "select current_setting('application_name') as application_name",
                )
                expect(result.length).equals(1)
                expect(result[0].application_name).equals("some test name")
            }),
        ))
    it("should not install custom extensions when none are specified", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT extname FROM pg_extension WHERE extname IN ('tablefunc', 'xml2')",
                )
                expect(result.length).equals(0)
            }),
        ))
})

describe("driver > postgres > connection options > custom extension installation", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                driverSpecific: {
                    extensions: ["tablefunc", "xml2"],
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should install specified extensions after connection", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT extname FROM pg_extension WHERE extname IN ('tablefunc', 'xml2')",
                )
                expect(result.length).equals(2)
                const installedExtensions = result.map((r: any) => r.extname)
                expect(installedExtensions).to.include("tablefunc")
                expect(installedExtensions).to.include("xml2")
            }),
        ))
})
