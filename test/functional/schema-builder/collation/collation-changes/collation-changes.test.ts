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
                const NEW_LENGTH = "255"
                col.collation = NEW_COLLATION
                col.length = NEW_LENGTH

                // capture generated up queries
                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                const tableName = meta.tableName
                const expectedUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(${NEW_LENGTH}) COLLATE "${NEW_COLLATION}"`
                const expectedDown = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(${OLD_LENGTH}) COLLATE "${OLD_COLLATION}"`

                // assert that the expected queries are in the generated SQL
                const upJoined = sqlInMemory.upQueries
                    .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                    .join(" ")
                expect(upJoined).to.include(expectedUp)
                expect(
                    sqlInMemory.upQueries.filter((q) =>
                        q.query.includes(`ALTER COLUMN "${COLUMN_NAME}" TYPE`),
                    ),
                ).to.have.length(1)
                const downJoined = sqlInMemory.downQueries
                    .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                    .join(" ")
                expect(downJoined).to.include(expectedDown)
                expect(
                    sqlInMemory.downQueries.filter((q) =>
                        q.query.includes(`ALTER COLUMN "${COLUMN_NAME}" TYPE`),
                    ),
                ).to.have.length(1)

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
                    expect(appliedColumn.length).to.equal(NEW_LENGTH)
                } finally {
                    await queryRunner.release()
                }
            }),
        )
    })
})
