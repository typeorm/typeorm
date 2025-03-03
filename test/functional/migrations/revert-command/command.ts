import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import { reloadTestingDatabases } from "../../../utils/test-utils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Migration } from "../../../../src"

describe("migrations > revert command", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                migrations: [__dirname + "/migration/*.js"],
                enabledDrivers: ["postgres", "sqlite"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(async () => {
        await reloadTestingDatabases(dataSources)
        await Promise.all(
            dataSources.map((dataSource) => dataSource.runMigrations()),
        )
    })
    after(() => closeTestingConnections(dataSources))

    const migrationsNames = [
        "ExampleMigrationOne1568745078665",
        "ExampleMigrationTwo1568745114903",
        "ExampleMigrationThree1568745177634",
        "ExampleMigrationFour1568745235514",
    ]

    it("should revert migrations executed after the specified one", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const before: Migration[] =
                    await dataSource.getExecutedMigrations()

                before.reverse()

                expect(before).to.have.lengthOf(4)
                expect(before[0]).to.includes({ name: migrationsNames[0] })
                expect(before[1]).to.includes({ name: migrationsNames[1] })

                await dataSource.revertMigration({
                    until: migrationsNames[1],
                })

                const after = await dataSource.getExecutedMigrations()
                expect(after).to.have.lengthOf(2)
                expect(after[0]).not.includes({ name: migrationsNames[0] })
                expect(after[1]).not.includes({ name: migrationsNames[1] })
            }),
        ))
    it("should not do anything if migration is not found", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const before = await dataSource.getExecutedMigrations()

                await dataSource.revertMigration({
                    until: "fake",
                })

                const after = await dataSource.getExecutedMigrations()

                expect(after).to.have.lengthOf(before.length)
            }),
        ))

    it(`should revert all migrations if "0" is specified`, () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.revertMigration({
                    until: "0",
                })

                const after = await dataSource.getExecutedMigrations()

                expect(after).to.have.lengthOf(0)
            }),
        ))
})
