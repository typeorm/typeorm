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
    const COLUMN_LENGTH = "100"
    const NEXT_COLUMN_LENGTH = "101"

    const joinQueries = (queries: { query: string }[]) =>
        queries.map((q) => q.query.replaceAll(/\s+/g, " ").trim()).join(" ")

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

                try {
                    col.collation = NEW_COLLATION

                    // capture generated up queries
                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log()
                    const tableName = meta.tableName
                    const expectedUp = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(${COLUMN_LENGTH}) COLLATE "${NEW_COLLATION}"`
                    const expectedDown = `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(${COLUMN_LENGTH}) COLLATE "${OLD_COLLATION}"`

                    // assert that the expected queries are in the generated SQL
                    const upJoined = joinQueries(sqlInMemory.upQueries)
                    expect(upJoined).to.include(expectedUp)
                    const downJoined = joinQueries(sqlInMemory.downQueries)
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
                        expect(originColumn.length).to.equal(COLUMN_LENGTH)

                        await connection.synchronize()

                        table = await queryRunner.getTable(meta.tableName)
                        const appliedColumn = table!.columns.find(
                            (c) => c.name === COLUMN_NAME,
                        )!
                        // new collation should be appeared
                        expect(appliedColumn.collation).to.equal(NEW_COLLATION)
                        expect(appliedColumn.length).to.equal(COLUMN_LENGTH)
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    col.collation = OLD_COLLATION
                    col.length = OLD_LENGTH
                }
            }),
        )
    })

    it("should preserve data and length when varchar length and collation change together", async () => {
        await Promise.all(
            dataSources.map(async (connection) => {
                const meta = connection.getMetadata(Item)
                const col = meta.columns.find(
                    (c) => c.propertyName === COLUMN_NAME,
                )!
                const OLD_COLLATION = col.collation
                const OLD_LENGTH = col.length

                try {
                    await connection.getRepository(Item).save({
                        name: "preserved",
                    })

                    col.collation = NEW_COLLATION
                    col.length = NEXT_COLUMN_LENGTH

                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log()
                    const tableName = meta.tableName
                    const upJoined = joinQueries(sqlInMemory.upQueries)
                    expect(upJoined).to.include(
                        `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(${NEXT_COLUMN_LENGTH}) COLLATE "${NEW_COLLATION}"`,
                    )
                    expect(
                        sqlInMemory.upQueries.filter((query) =>
                            query.query.includes(
                                `ALTER TABLE "${tableName}" ALTER COLUMN "${COLUMN_NAME}" TYPE`,
                            ),
                        ),
                    ).to.have.length(1)
                    expect(upJoined).not.to.include("DROP COLUMN")
                    expect(upJoined).not.to.include(
                        `TYPE character varying COLLATE "${NEW_COLLATION}"`,
                    )

                    await connection.synchronize()

                    const stored = await connection
                        .getRepository(Item)
                        .findOneByOrFail({ name: "preserved" })
                    expect(stored.name).to.equal("preserved")

                    const queryRunner = connection.createQueryRunner()
                    try {
                        const table = await queryRunner.getTable(meta.tableName)
                        const appliedColumn = table!.columns.find(
                            (c) => c.name === COLUMN_NAME,
                        )!
                        expect(appliedColumn.collation).to.equal(NEW_COLLATION)
                        expect(appliedColumn.length).to.equal(
                            NEXT_COLUMN_LENGTH,
                        )
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    col.collation = OLD_COLLATION
                    col.length = OLD_LENGTH
                }
            }),
        )
    })
})
