import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Example } from "./entity/Example"
import { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import sinon from "sinon"

describe("github issues > #10131 optional to disable ascii to unicode parameter conversion", () => {
    let connections: DataSource[]

    beforeEach(() => reloadTestingDatabases(connections))
    afterEach(() => sinon.restore())

    describe("when disableAsciiToUnicodeParamConversion is true", () => {
        let driver: SqlServerDriver

        beforeAll(async () => {
            connections = await createTestingConnections({
                entities: [Example],
                enabledDrivers: ["mssql"],
                schemaCreate: false,
                dropSchema: true,
                driverSpecific: {
                    options: {
                        disableAsciiToUnicodeParamConversion: true,
                    },
                },
            })
        })
        afterAll(() => closeTestingConnections(connections))

        it("should disable ascii to unicode parameter conversion", () =>
            Promise.all(
                connections.map(async (connection) => {
                    driver = new SqlServerDriver(connection)

                    const driverNCharSpy = sinon.spy(driver.mssql, "NChar")
                    const driverNVarCharSpy = sinon.spy(
                        driver.mssql,
                        "NVarChar",
                    )
                    const driverCharSpy = sinon.spy(driver.mssql, "Char")
                    const driverVarCharSpy = sinon.spy(driver.mssql, "VarChar")

                    const entity = new Example()
                    entity.varCharField = "test"
                    entity.charField = "test"

                    const repo = connection.getRepository(Example)
                    await repo.save(entity)

                    sinon.assert.called(driverCharSpy)
                    sinon.assert.called(driverVarCharSpy)
                    sinon.assert.notCalled(driverNCharSpy)
                    sinon.assert.notCalled(driverNVarCharSpy)
                }),
            ))
    })

    describe("when disableAsciiToUnicodeParamConversion is false", () => {
        let driver: SqlServerDriver

        beforeAll(async () => {
            connections = await createTestingConnections({
                entities: [Example],
                enabledDrivers: ["mssql"],
                schemaCreate: false,
                dropSchema: true,
                driverSpecific: {
                    options: {
                        disableAsciiToUnicodeParamConversion: false,
                    },
                },
            })
        })
        afterAll(() => closeTestingConnections(connections))

        it("should not disable ascii to unicode parameter conversion", () =>
            Promise.all(
                connections.map(async (connection) => {
                    driver = new SqlServerDriver(connection)

                    const driverNCharSpy = sinon.spy(driver.mssql, "NChar")
                    const driverNVarCharSpy = sinon.spy(
                        driver.mssql,
                        "NVarChar",
                    )
                    const driverCharSpy = sinon.spy(driver.mssql, "Char")
                    const driverVarCharSpy = sinon.spy(driver.mssql, "VarChar")

                    const entity = new Example()
                    entity.varCharField = "test"
                    entity.charField = "test"

                    const repo = connection.getRepository(Example)
                    await repo.save(entity)

                    sinon.assert.notCalled(driverCharSpy)
                    sinon.assert.notCalled(driverVarCharSpy)
                    sinon.assert.called(driverNCharSpy)
                    sinon.assert.called(driverNVarCharSpy)
                }),
            ))
    })
})
