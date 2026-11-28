import "reflect-metadata"
import { expect } from "chai"
import type { DataSource, Table } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Thing } from "./entity/Thing"

// https://github.com/typeorm/typeorm/issues/12986
describe("schema builder > idempotency > overlapping unique constraints", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Thing],
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mssql",
                "oracle",
                "postgres",
                "sqljs",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load each unique with its own name and plan no query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let table: Table | undefined
                try {
                    table = await queryRunner.getTable("thing")
                } finally {
                    await queryRunner.release()
                }

                const uniques = Object.fromEntries(
                    table!.uniques.map((unique) => [
                        unique.name,
                        [...unique.columnNames].sort(),
                    ]),
                )
                expect(uniques).to.eql({
                    thing_long: ["first", "second", "third"],
                    thing_short: ["first", "second"],
                })

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
