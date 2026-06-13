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

                try {
                    col.collation = NEW_COLLATION

                    // capture generated up queries
                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log()
                    const tableName = meta.tableName
                    const expectedUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(100) COLLATE "${NEW_COLLATION}"`
                    const expectedDown = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(100) COLLATE "${OLD_COLLATION}"`

                    // assert that the expected queries are in the generated SQL
                    const upJoined = sqlInMemory.upQueries
                        .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                        .join(" ")
                    expect(upJoined).to.include(expectedUp)
                    const downJoined = sqlInMemory.downQueries
                        .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                        .join(" ")
                    expect(downJoined).to.include(expectedDown)

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
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    col.collation = OLD_COLLATION
                }
            }),
        )
    })

    it("ALTER ... COLLATE query should preserve length changes", async () => {
        await Promise.all(
            dataSources.map(async (connection) => {
                const meta = connection.getMetadata(Item)
                const col = meta.columns.find(
                    (c) => c.propertyName === COLUMN_NAME,
                )!
                const OLD_COLLATION = col.collation
                col.length = "500"
                col.collation = NEW_COLLATION

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()
                const tableName = meta.tableName
                const expectedUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(500) COLLATE "${NEW_COLLATION}"`
                const expectedDown = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(100) COLLATE "${OLD_COLLATION}"`
                const strippedLengthUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying COLLATE "${NEW_COLLATION}"`

                const upJoined = sqlInMemory.upQueries
                    .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                    .join(" ")
                expect(upJoined).to.include(expectedUp)
                expect(upJoined).to.not.include(strippedLengthUp)

                const downJoined = sqlInMemory.downQueries
                    .map((q) => q.query.replaceAll(/\s+/g, " ").trim())
                    .join(" ")
                expect(downJoined).to.include(expectedDown)

                const queryRunner = connection.createQueryRunner()

                try {
                    await connection.synchronize()

                    const table = await queryRunner.getTable(meta.tableName)
                    const appliedColumn = table!.columns.find(
                        (c) => c.name === COLUMN_NAME,
                    )!
                    expect(appliedColumn.length).to.equal("500")
                    expect(appliedColumn.collation).to.equal(NEW_COLLATION)
                } finally {
                    await queryRunner.release()
                    col.length = "100"
                    col.collation = OLD_COLLATION
                }
            }),
        )
    })
})
