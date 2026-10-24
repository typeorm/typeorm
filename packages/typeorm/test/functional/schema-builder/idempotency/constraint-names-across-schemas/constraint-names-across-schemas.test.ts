import "reflect-metadata"
import { expect } from "chai"
import type { DataSource, Table } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"
import { ItemOne } from "./entity/ItemOne"
import { ItemTwo } from "./entity/ItemTwo"
import { LinkOne } from "./entity/LinkOne"
import { LinkTwo } from "./entity/LinkTwo"

// https://github.com/typeorm/typeorm/issues/12986
describe("schema builder > idempotency > constraint names across schemas", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ItemOne, ItemTwo, LinkOne, LinkTwo],
            enabledDrivers: ["cockroachdb", "mssql", "postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should load each table's own constraint columns and plan no query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.createSchema("schema_one", true)
                    await queryRunner.createSchema("schema_two", true)
                } finally {
                    await queryRunner.release()
                }
                await dataSource.synchronize()

                const loader = dataSource.createQueryRunner()
                let tables: Table[]
                try {
                    tables = await loader.getTables([
                        "schema_one.item",
                        "schema_two.item",
                        "schema_one.link",
                        "schema_two.link",
                    ])
                } finally {
                    await loader.release()
                }

                expect(tables).to.have.length(4)
                for (const table of tables.filter((t) =>
                    t.name.endsWith("item"),
                )) {
                    expect(table.uniques).to.have.length(1)
                    expect(table.uniques[0].columnNames).to.have.members([
                        "code",
                        "tenant",
                    ])
                    expect(table.uniques[0].columnNames).to.have.length(2)
                    expect(table.checks).to.have.length(1)
                    expect(table.checks[0].columnNames).to.eql(["code"])
                }
                for (const table of tables.filter((t) =>
                    t.name.endsWith("link"),
                )) {
                    expect(table.foreignKeys).to.have.length(1)
                    expect(table.foreignKeys[0].columnNames).to.have.members([
                        "item_code",
                        "item_tenant",
                    ])
                    expect(table.foreignKeys[0].columnNames).to.have.length(2)
                    expect(
                        table.foreignKeys[0].referencedColumnNames,
                    ).to.have.members(["code", "tenant"])
                    expect(
                        table.foreignKeys[0].referencedColumnNames,
                    ).to.have.length(2)
                }

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.eql([])
                expect(sqlInMemory.downQueries).to.eql([])
            }),
        ))
})
