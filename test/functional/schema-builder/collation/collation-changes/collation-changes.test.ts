import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Item, NEW_COLLATION } from "./entity/item.entity"

describe("schema builder > collation > collation changes", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            driverSpecific: {
                applicationName: "collation-detection-test",
            },
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const COLUMN_NAME = "name"

    it("ALTER ... COLLATE query should be created", async () => {
        await Promise.all(
            dataSources.map(async (connection) => {
                // change metadata
                const meta = connection.getMetadata(Item)
                const col = meta.columns.find(
                    (c) => c.propertyName === COLUMN_NAME,
                )!
                const OLD_COLLATION = col.collation
                const OLD_LENGTH = col.length
                col.collation = NEW_COLLATION
                col.length = "101"

                // capture generated up queries
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                const tableName = meta.tableName
                const expectedUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(101) COLLATE "${NEW_COLLATION}"`
                const expectedDown = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(${OLD_LENGTH}) COLLATE "${OLD_COLLATION}"`

                // assert that the expected queries are in the generated SQL
                const upQueries = sqlInMemory.upQueries
                    .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                    .filter((query) =>
                        query.includes(`ALTER COLUMN "${COLUMN_NAME}" TYPE`),
                    )
                expect(upQueries).to.eql([expectedUp])
                const downQueries = sqlInMemory.downQueries
                    .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                    .filter((query) =>
                        query.includes(`ALTER COLUMN "${COLUMN_NAME}" TYPE`),
                    )
                expect(downQueries).to.eql([expectedDown])

                // assert that collation changes are applied to the database
                const queryRunner = connection.createQueryRunner()

                try {
                    let table = await queryRunner.getTable(meta.tableName)
                    const originColumn = table!.columns.find(
                        (c) => c.name === COLUMN_NAME,
                    )!
                    // old collation should be appeared
                    expect(originColumn.collation).to.equal(OLD_COLLATION)

                    await connection.synchronize()

                    table = await queryRunner.getTable(meta.tableName)
                    const appliedColumn = table!.columns.find(
                        (c) => c.name === COLUMN_NAME,
                    )!
                    // new collation should be appeared
                    expect(appliedColumn.collation).to.equal(NEW_COLLATION)
                    expect(appliedColumn.length).to.equal("101")
                } finally {
                    col.collation = OLD_COLLATION
                    col.length = OLD_LENGTH
                    await queryRunner.release()
                }
            }),
        )
    })
})
