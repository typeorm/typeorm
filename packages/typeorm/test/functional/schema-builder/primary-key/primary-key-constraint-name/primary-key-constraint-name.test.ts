import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Author } from "./entity/Author"
import { Book } from "./entity/Book"
import { Tag } from "./entity/Tag"

describe("schema builder > primary key > constraint name", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Author, Book, Tag],
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const setConstraintName = (
        dataSource: DataSource,
        target: typeof Author | typeof Tag,
        name: string | undefined,
    ) => {
        for (const column of dataSource.getMetadata(target).primaryColumns) {
            column.primaryKeyConstraintName = name
        }
    }

    const getConstraintName = async (dataSource: DataSource, table: string) => {
        const queryRunner = dataSource.createQueryRunner()
        try {
            const loadedTable = await queryRunner.getTable(table)
            return loadedTable!.primaryColumns.map(
                (column) => column.primaryKeyConstraintName,
            )
        } finally {
            await queryRunner.release()
        }
    }

    // GitHub issue #11636
    it("should rename the primary key when its constraint name changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const author = await dataSource
                    .getRepository(Author)
                    .save({ name: "Jane" })
                await dataSource.getRepository(Book).save({ author })

                setConstraintName(dataSource, Author, "PK_AUTHOR_RENAMED")
                setConstraintName(dataSource, Tag, "PK_TAG_RENAMED")

                try {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    expect(sqlInMemory.upQueries).to.have.length(2)

                    await dataSource.synchronize()

                    expect(
                        await getConstraintName(dataSource, "author"),
                    ).to.eql(["PK_AUTHOR_RENAMED"])
                    expect(await getConstraintName(dataSource, "tag")).to.eql([
                        "PK_TAG_RENAMED",
                        "PK_TAG_RENAMED",
                    ])
                    expect(
                        await dataSource.getRepository(Book).count(),
                    ).to.equal(1)

                    const nextSqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    expect(nextSqlInMemory.upQueries).to.be.empty
                } finally {
                    setConstraintName(dataSource, Author, "PK_AUTHOR")
                    setConstraintName(dataSource, Tag, "PK_TAG")
                }
            }),
        ))

    it("should rename the primary key back to the default constraint name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                setConstraintName(dataSource, Author, undefined)

                try {
                    await dataSource.synchronize()

                    expect(
                        await getConstraintName(dataSource, "author"),
                    ).to.eql([undefined])

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    expect(sqlInMemory.upQueries).to.be.empty
                } finally {
                    setConstraintName(dataSource, Author, "PK_AUTHOR")
                }
            }),
        ))
})
