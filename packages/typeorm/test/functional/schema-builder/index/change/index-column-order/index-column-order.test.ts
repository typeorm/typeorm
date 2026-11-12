import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import { Table } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { Lookup } from "./entity/Lookup"
import { Reversed } from "./entity/Reversed"
import { Twin } from "./entity/Twin"

const loadTable = async (
    dataSource: DataSource,
    tableName: string,
): Promise<Table> => {
    const queryRunner = dataSource.createQueryRunner()
    try {
        return (await queryRunner.getTable(tableName))!
    } finally {
        await queryRunner.release()
    }
}

const createTableBefore = async (
    dataSource: DataSource,
    table: Table,
): Promise<void> => {
    const queryRunner = dataSource.createQueryRunner()
    try {
        await queryRunner.dropTable(table.name, true)
        await queryRunner.createTable(table)
    } finally {
        await queryRunner.release()
    }
}

const expectNoPendingQueries = async (
    dataSource: DataSource,
): Promise<void> => {
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log()
    expect(sqlInMemory.upQueries).to.eql([])
    expect(sqlInMemory.downQueries).to.eql([])
}

// https://github.com/typeorm/typeorm/issues/12987
describe("schema builder > index > change > index column order", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Lookup, Twin, Reversed],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should read the columns of an index back in key order", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                for (const entity of [Reversed, Lookup, Twin])
                    await createTableBefore(
                        dataSource,
                        Table.create(
                            dataSource.getMetadata(entity),
                            dataSource.driver,
                        ),
                    )

                const table = await loadTable(dataSource, "reversed")

                const named = table.indices.find(
                    (index) => index.name === "reversed_pair",
                )
                expect(named!.columnNames).to.eql(["zeta", "alpha"])
                const generated = table.indices.find(
                    (index) => index.name !== "reversed_pair",
                )
                expect(generated!.columnNames).to.eql(["zeta", "alpha", "mid"])
                await expectNoPendingQueries(dataSource)
            }),
        ))

    it("should recreate a named index when its columns are swapped", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const table = Table.create(
                    dataSource.getMetadata(Lookup),
                    dataSource.driver,
                )
                table.indices[0].columnNames = ["second", "first"]
                await createTableBefore(dataSource, table)

                await dataSource.synchronize()

                const synchronized = await loadTable(dataSource, "lookup")
                expect(synchronized.indices).to.have.length(1)
                expect(synchronized.indices[0].name).to.equal("lookup_pair")
                expect(synchronized.indices[0].columnNames).to.eql([
                    "first",
                    "second",
                ])
                await expectNoPendingQueries(dataSource)
            }),
        ))

    it("should recreate an index with a generated name when its columns are swapped", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const table = Table.create(
                    dataSource.getMetadata(Twin),
                    dataSource.driver,
                )
                table.indices[0].columnNames = ["second", "first"]
                await createTableBefore(dataSource, table)

                await dataSource.synchronize()

                const synchronized = await loadTable(dataSource, "twin")
                expect(synchronized.indices).to.have.length(1)
                expect(synchronized.indices[0].columnNames).to.eql([
                    "first",
                    "second",
                ])
                await expectNoPendingQueries(dataSource)
            }),
        ))
})

describe("schema builder > index > change > index column order > covering index", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Reversed],
            enabledDrivers: ["postgres"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should read the key columns of a covering index first", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await createTableBefore(
                    dataSource,
                    Table.create(
                        dataSource.getMetadata(Reversed),
                        dataSource.driver,
                    ),
                )
                await dataSource.query(
                    `CREATE INDEX "reversed_covering" ON "reversed" ("zeta", "alpha") INCLUDE ("mid")`,
                )

                const table = await loadTable(dataSource, "reversed")
                const covering = table.indices.find(
                    (index) => index.name === "reversed_covering",
                )
                expect(covering!.columnNames.slice(0, 2)).to.eql([
                    "zeta",
                    "alpha",
                ])
            }),
        ))
})
