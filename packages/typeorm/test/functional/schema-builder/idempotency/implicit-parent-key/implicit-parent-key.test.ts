import "reflect-metadata"
import { expect } from "chai"
import type { DataSource, Table } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"
import { Child } from "./entity/Child"
import { Parent } from "./entity/Parent"

// https://github.com/typeorm/typeorm/issues/12986
describe("schema builder > idempotency > implicit parent key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Parent, Child],
            enabledDrivers: ["better-sqlite3", "sqljs"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should read the parent key of a foreign key declared without columns and plan no query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const foreignKeyName = dataSource.namingStrategy.foreignKeyName(
                    "child",
                    ["parent_id"],
                    "parent",
                    ["id"],
                )
                await dataSource.query(
                    `CREATE TABLE "parent" ("id" integer PRIMARY KEY NOT NULL, "code" varchar NOT NULL)`,
                )
                await dataSource.query(
                    `CREATE TABLE "child" ("id" integer PRIMARY KEY NOT NULL, "parent_id" integer, CONSTRAINT "${foreignKeyName}" FOREIGN KEY ("parent_id") REFERENCES "parent")`,
                )

                const queryRunner = dataSource.createQueryRunner()
                let table: Table | undefined
                try {
                    table = await queryRunner.getTable("child")
                } finally {
                    await queryRunner.release()
                }
                expect(table!.foreignKeys).to.have.length(1)
                expect(table!.foreignKeys[0].referencedColumnNames).to.eql([
                    "id",
                ])

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
