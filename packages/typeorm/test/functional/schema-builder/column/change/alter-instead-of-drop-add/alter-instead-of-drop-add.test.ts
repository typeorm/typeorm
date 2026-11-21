import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../../src/index.js"
import type { SqlInMemory } from "../../../../../../src/driver/SqlInMemory"
import type { ColumnMetadata } from "../../../../../../src/metadata/ColumnMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Post } from "./entity/Post"

// github issue #3357: migration generation must ALTER columns instead of
// dropping and re-adding them (which causes data loss)
describe("schema builder > change column > alter instead of drop+add (issue #3357)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: [
                "postgres",
                "cockroachdb",
                "mysql",
                "mariadb",
                "aurora-mysql",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const dropColumnQueries = (sql: SqlInMemory, column: string) =>
        sql.upQueries
            .map((q) => q.query)
            .filter((q) =>
                new RegExp(`DROP COLUMN [\\\`"']${column}[\\\`"']`, "i").test(
                    q,
                ),
            )

    const addColumnQueries = (sql: SqlInMemory, column: string) =>
        sql.upQueries
            .map((q) => q.query)
            .filter((q) =>
                new RegExp(`\\bADD [\\\`"']${column}[\\\`"']`, "i").test(q),
            )

    const alterColumnQueries = (sql: SqlInMemory, column: string) =>
        sql.upQueries
            .map((q) => q.query)
            .filter((q) =>
                new RegExp(
                    `(ALTER COLUMN|CHANGE) [\\\`"']${column}[\\\`"']`,
                    "i",
                ).test(q),
            )

    function expectAlterInsteadOfDropAdd(
        sql: SqlInMemory,
        column: string,
    ): void {
        const allUpQueries = sql.upQueries.map((q) => q.query)
        expect(
            dropColumnQueries(sql, column),
            `expected no DROP COLUMN for "${column}", got: ${JSON.stringify(
                allUpQueries,
            )}`,
        ).to.have.length(0)
        expect(
            addColumnQueries(sql, column),
            `expected no ADD COLUMN for "${column}", got: ${JSON.stringify(
                allUpQueries,
            )}`,
        ).to.have.length(0)
        expect(
            alterColumnQueries(sql, column).length,
            `expected an ALTER/CHANGE statement for "${column}", got: ${JSON.stringify(
                allUpQueries,
            )}`,
        ).to.be.greaterThan(0)
    }

    it("should generate ALTER COLUMN TYPE instead of DROP+ADD when column length changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const nameColumn = dataSource
                    .getMetadata(Post)
                    .findColumnWithPropertyName("name")!
                nameColumn.length = "51"
                try {
                    // insert a row to prove that data is not lost
                    await dataSource.getRepository(Post).insert({
                        name: "data that must survive the migration",
                        description: "description",
                        version: 1,
                    })

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expectAlterInsteadOfDropAdd(sqlInMemory, "name")

                    if (dataSource.driver.options.type === "postgres") {
                        const typeQueries = sqlInMemory.upQueries
                            .map((q) => q.query)
                            .filter((q) =>
                                q.includes(
                                    `ALTER COLUMN "name" TYPE character varying(51)`,
                                ),
                            )
                        expect(typeQueries).to.have.length(1)
                    }

                    // apply the generated migration and check the data survived
                    await dataSource.synchronize()
                    const posts = await dataSource.getRepository(Post).find()
                    expect(posts).to.have.length(1)
                    expect(posts[0].name).to.equal(
                        "data that must survive the migration",
                    )

                    const queryRunner = dataSource.createQueryRunner()
                    const postTable = await queryRunner.getTable("post")
                    await queryRunner.release()
                    expect(
                        postTable!.findColumnByName("name")!.length,
                    ).to.equal("51")
                } finally {
                    nameColumn.length = "50"
                }
            }),
        ))

    it("should generate ALTER COLUMN TYPE instead of DROP+ADD when column type changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const descriptionColumn = dataSource
                    .getMetadata(Post)
                    .findColumnWithPropertyName("description")!
                descriptionColumn.type = "text"
                descriptionColumn.length = ""
                try {
                    await dataSource.getRepository(Post).insert({
                        name: "post name",
                        description: "text that must survive the migration",
                        version: 1,
                    })

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expectAlterInsteadOfDropAdd(sqlInMemory, "description")

                    if (dataSource.driver.options.type === "postgres") {
                        const typeQueries = sqlInMemory.upQueries
                            .map((q) => q.query)
                            .filter((q) =>
                                q.includes(
                                    `ALTER COLUMN "description" TYPE text`,
                                ),
                            )
                        expect(typeQueries).to.have.length(1)
                    }

                    await dataSource.synchronize()
                    const posts = await dataSource.getRepository(Post).find()
                    expect(posts).to.have.length(1)
                    expect(posts[0].description).to.equal(
                        "text that must survive the migration",
                    )
                } finally {
                    descriptionColumn.type = "varchar"
                    descriptionColumn.length = ""
                }
            }),
        ))

    it("should generate ALTER COLUMN instead of DROP+ADD when column nullability changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const nameColumn = dataSource
                    .getMetadata(Post)
                    .findColumnWithPropertyName("name")!
                nameColumn.isNullable = true
                try {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expectAlterInsteadOfDropAdd(sqlInMemory, "name")

                    if (dataSource.driver.options.type === "postgres") {
                        const nullQueries = sqlInMemory.upQueries
                            .map((q) => q.query)
                            .filter((q) =>
                                q.includes(`ALTER COLUMN "name" DROP NOT NULL`),
                            )
                        expect(nullQueries).to.have.length(1)
                    }

                    await dataSource.synchronize()
                    const queryRunner = dataSource.createQueryRunner()
                    const postTable = await queryRunner.getTable("post")
                    await queryRunner.release()
                    expect(postTable!.findColumnByName("name")!.isNullable).to
                        .be.true
                } finally {
                    nameColumn.isNullable = false
                }
            }),
        ))

    it("should generate ALTER COLUMN SET DEFAULT instead of DROP+ADD when column default changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const versionColumn = dataSource
                    .getMetadata(Post)
                    .findColumnWithPropertyName("version")!
                versionColumn.default = 42
                versionColumn.build(dataSource)
                try {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expectAlterInsteadOfDropAdd(sqlInMemory, "version")

                    if (dataSource.driver.options.type === "postgres") {
                        const defaultQueries = sqlInMemory.upQueries
                            .map((q) => q.query)
                            .filter((q) =>
                                q.includes(
                                    `ALTER COLUMN "version" SET DEFAULT '42'`,
                                ),
                            )
                        expect(defaultQueries).to.have.length(1)
                    }

                    await dataSource.synchronize()
                    const queryRunner = dataSource.createQueryRunner()
                    const postTable = await queryRunner.getTable("post")
                    await queryRunner.release()
                    expect(
                        postTable!.findColumnByName("version")!.default,
                    ).to.equal("'42'")
                } finally {
                    versionColumn.default = 0
                    versionColumn.build(dataSource)
                }
            }),
        ))

    it("should not drop+add when several column properties change at once (length + nullability)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const nameColumn = dataSource
                    .getMetadata(Post)
                    .findColumnWithPropertyName("name")! as ColumnMetadata
                nameColumn.length = "100"
                nameColumn.isNullable = true
                try {
                    await dataSource.getRepository(Post).insert({
                        name: "another row that must survive",
                        version: 2,
                    })

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expectAlterInsteadOfDropAdd(sqlInMemory, "name")

                    await dataSource.synchronize()
                    const posts = await dataSource.getRepository(Post).find()
                    expect(posts).to.have.length(1)
                    expect(posts[0].name).to.equal(
                        "another row that must survive",
                    )
                } finally {
                    nameColumn.length = "50"
                    nameColumn.isNullable = false
                }
            }),
        ))
})
