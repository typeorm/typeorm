import { expect } from "chai"
import "reflect-metadata"
import sinon from "sinon"

import type { DataSource } from "../../../src/data-source/DataSource"
import { QueryFailedError } from "../../../src/error/QueryFailedError"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"
import { Table } from "../../../src/schema-builder/table/Table"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

// MySQL generates a support index named after a foreign key when nothing else covers
// its columns, and renames it along with the constraint. If the constraint is ever
// dropped and re-added while that index is kept (e.g. to change ON DELETE), the index
// stays under its original name but MySQL no longer renames it with the constraint.
// https://github.com/typeorm/typeorm/issues/12671
describe("query runner > rename table > foreign key support indexes (mysql)", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mysql"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function indexes(queryRunner: QueryRunner, tablePath: string) {
        const rows: {
            Key_name: string
            Column_name: string
            Seq_in_index: number
        }[] = await queryRunner.query(
            `SHOW INDEX FROM ${tablePath
                .split(".")
                .map((part) => `\`${part}\``)
                .join(".")}`,
        )
        const columnsByIndex: Record<string, string[]> = {}
        for (const row of rows) {
            ;(columnsByIndex[row.Key_name] ??= [])[row.Seq_in_index - 1] =
                row.Column_name
        }
        return Object.entries(columnsByIndex)
            .map(([name, columns]) => `${name}(${columns.join(",")})`)
            .sort()
    }

    // Recreates a foreign key while keeping its same-named index, so MySQL no longer
    // treats the index as the one it generated for the constraint.
    async function detachSupportIndex(
        queryRunner: QueryRunner,
        table: string,
        foreignKeyName: string,
        definition: string,
    ) {
        const columns = definition.slice(
            definition.indexOf("("),
            definition.indexOf(")") + 1,
        )
        await queryRunner.query(
            `ALTER TABLE ${table} DROP FOREIGN KEY \`${foreignKeyName}\``,
        )
        await queryRunner.query(
            `ALTER TABLE ${table} DROP INDEX \`${foreignKeyName}\``,
        )
        await queryRunner.query(
            `CREATE INDEX \`${foreignKeyName}\` ON ${table} ${columns}`,
        )
        await queryRunner.query(
            `ALTER TABLE ${table} ADD CONSTRAINT \`${foreignKeyName}\` ${definition}`,
        )
    }

    async function createAuthors(queryRunner: QueryRunner) {
        await queryRunner.query(
            "CREATE TABLE `authors` (`id` int NOT NULL PRIMARY KEY)",
        )
    }

    it("renames an FK index left over from an earlier constraint", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string, column: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [column])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `articles` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, `editorId` int NOT NULL, `slug` varchar(64) NOT NULL, " +
                        `CONSTRAINT \`${fk("articles", "authorId")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`), ` +
                        `CONSTRAINT \`${fk("articles", "editorId")}\` FOREIGN KEY (\`editorId\`) REFERENCES \`authors\` (\`id\`), ` +
                        "INDEX `idx_articles_editor_lookup` (`editorId`, `slug`))",
                )
                await detachSupportIndex(
                    queryRunner,
                    "`articles`",
                    fk("articles", "authorId"),
                    "FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`) ON DELETE CASCADE",
                )
                const original = await indexes(queryRunner, "articles")

                queryRunner.clearSqlMemory()
                await queryRunner.renameTable("articles", "posts")

                expect(await indexes(queryRunner, "posts")).to.deep.equal(
                    [
                        "PRIMARY(id)",
                        `${fk("posts", "authorId")}(authorId)`,
                        "idx_articles_editor_lookup(editorId,slug)",
                    ].sort(),
                )
                const posts = await queryRunner.getTable("posts")
                expect(
                    posts!.indices.map((index) => index.name),
                ).to.not.include(fk("articles", "authorId"))

                const rejection = await queryRunner
                    .query(
                        "INSERT INTO `posts` (`id`, `authorId`, `editorId`, `slug`) VALUES (1, 999, 999, 'orphan')",
                    )
                    .catch((error: unknown) => error)
                expect(rejection)
                    .to.be.instanceOf(QueryFailedError)
                    .with.nested.property(
                        "driverError.code",
                        "ER_NO_REFERENCED_ROW_2",
                    )

                await queryRunner.executeMemoryDownSql()
                expect(await indexes(queryRunner, "articles")).to.deep.equal(
                    original,
                )
                await queryRunner.release()
            }),
        ))

    it("renames an FK index MySQL still manages without failing", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `reviews` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, " +
                        `CONSTRAINT \`${fk("reviews")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`))`,
                )

                queryRunner.clearSqlMemory()
                await queryRunner.renameTable("reviews", "critiques")
                expect(await indexes(queryRunner, "critiques")).to.deep.equal(
                    ["PRIMARY(id)", `${fk("critiques")}(authorId)`].sort(),
                )

                await queryRunner.executeMemoryDownSql()
                expect(await indexes(queryRunner, "reviews")).to.deep.equal(
                    ["PRIMARY(id)", `${fk("reviews")}(authorId)`].sort(),
                )
                await queryRunner.release()
            }),
        ))

    it("keeps a composite FK index in the foreign key's column order", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "lang",
                        "bookId",
                    ])
                await queryRunner.query(
                    "CREATE TABLE `editions` (`lang` varchar(8) NOT NULL, `bookId` int NOT NULL, PRIMARY KEY (`lang`, `bookId`))",
                )
                await queryRunner.query(
                    "CREATE TABLE `translations` (`id` int NOT NULL PRIMARY KEY, `lang` varchar(8) NOT NULL, `bookId` int NOT NULL, " +
                        `CONSTRAINT \`${fk("translations")}\` FOREIGN KEY (\`lang\`, \`bookId\`) REFERENCES \`editions\` (\`lang\`, \`bookId\`))`,
                )
                await detachSupportIndex(
                    queryRunner,
                    "`translations`",
                    fk("translations"),
                    "FOREIGN KEY (`lang`, `bookId`) REFERENCES `editions` (`lang`, `bookId`)",
                )

                await queryRunner.renameTable("translations", "localizations")

                expect(
                    await indexes(queryRunner, "localizations"),
                ).to.deep.equal(
                    [
                        "PRIMARY(id)",
                        `${fk("localizations")}(lang,bookId)`,
                    ].sort(),
                )
                await queryRunner.release()
            }),
        ))

    it("renames a junction table whose FK is supported by its primary key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string, column: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [column])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `coauthors` (`authorId` int NOT NULL, `coauthorId` int NOT NULL, PRIMARY KEY (`authorId`, `coauthorId`), " +
                        `CONSTRAINT \`${fk("coauthors", "authorId")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`), ` +
                        `CONSTRAINT \`${fk("coauthors", "coauthorId")}\` FOREIGN KEY (\`coauthorId\`) REFERENCES \`authors\` (\`id\`))`,
                )

                await queryRunner.renameTable("coauthors", "collaborators")

                expect(
                    await indexes(queryRunner, "collaborators"),
                ).to.deep.equal(
                    [
                        "PRIMARY(authorId,coauthorId)",
                        `${fk("collaborators", "coauthorId")}(coauthorId)`,
                    ].sort(),
                )
                await queryRunner.release()
            }),
        ))

    it("leaves no stale FK-named index when another index also covers the FK", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `drafts` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, `createdAt` datetime NOT NULL, " +
                        `CONSTRAINT \`${fk("drafts")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`))`,
                )
                await detachSupportIndex(
                    queryRunner,
                    "`drafts`",
                    fk("drafts"),
                    "FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`)",
                )
                await queryRunner.query(
                    "CREATE INDEX `idx_drafts_author_created` ON `drafts` (`authorId`, `createdAt`)",
                )
                const original = await indexes(queryRunner, "drafts")

                queryRunner.clearSqlMemory()
                await queryRunner.renameTable("drafts", "sketches")

                const renamed = await indexes(queryRunner, "sketches")
                expect(renamed.join(" ")).to.not.include(fk("drafts"))
                expect(renamed).to.include(
                    "idx_drafts_author_created(authorId,createdAt)",
                )

                await queryRunner.executeMemoryDownSql()
                expect(await indexes(queryRunner, "drafts")).to.deep.equal(
                    original,
                )
                await queryRunner.release()
            }),
        ))

    it("keeps an FK-named index it cannot recreate faithfully", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `pages` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, " +
                        `CONSTRAINT \`${fk("pages")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`))`,
                )
                await queryRunner.query(
                    `ALTER TABLE \`pages\` DROP FOREIGN KEY \`${fk("pages")}\``,
                )
                await queryRunner.query(
                    `ALTER TABLE \`pages\` DROP INDEX \`${fk("pages")}\``,
                )
                await queryRunner.query(
                    `CREATE INDEX \`${fk("pages")}\` ON \`pages\` (\`authorId\`) COMMENT 'author lookup'`,
                )
                await queryRunner.query(
                    `ALTER TABLE \`pages\` ADD CONSTRAINT \`${fk("pages")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`)`,
                )

                await queryRunner.renameTable("pages", "leaves")

                const rows: { Key_name: string; Index_comment: string }[] =
                    await queryRunner.query("SHOW INDEX FROM `leaves`")
                expect(
                    rows.find((row) => row.Key_name === fk("pages"))
                        ?.Index_comment,
                ).to.equal("author lookup")
                await queryRunner.release()
            }),
        ))

    it("keeps the FK index when another index already has its new name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `chapters` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, `position` int NOT NULL, " +
                        `CONSTRAINT \`${fk("chapters")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`))`,
                )
                await detachSupportIndex(
                    queryRunner,
                    "`chapters`",
                    fk("chapters"),
                    "FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`)",
                )
                await queryRunner.query(
                    `CREATE INDEX \`${fk("sections")}\` ON \`chapters\` (\`position\`)`,
                )
                const original = await indexes(queryRunner, "chapters")

                queryRunner.clearSqlMemory()
                await queryRunner.renameTable("chapters", "sections")

                const sections = await queryRunner.getTable("sections")
                expect(
                    sections!.foreignKeys.map((foreignKey) => foreignKey.name),
                ).to.deep.equal([fk("sections")])
                expect(await indexes(queryRunner, "sections")).to.deep.equal(
                    [
                        "PRIMARY(id)",
                        `${fk("chapters")}(authorId)`,
                        `${fk("sections")}(position)`,
                    ].sort(),
                )

                await queryRunner.executeMemoryDownSql()
                expect(await indexes(queryRunner, "chapters")).to.deep.equal(
                    original,
                )
                await queryRunner.release()
            }),
        ))

    it("renames an FK index that also supports another foreign key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `members` (`id` int NOT NULL PRIMARY KEY)",
                )
                await queryRunner.query(
                    "CREATE TABLE `essays` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, " +
                        `CONSTRAINT \`${fk("essays")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`))`,
                )
                await detachSupportIndex(
                    queryRunner,
                    "`essays`",
                    fk("essays"),
                    "FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`)",
                )
                await queryRunner.query(
                    "ALTER TABLE `essays` ADD CONSTRAINT `fk_essays_member` FOREIGN KEY (`authorId`) REFERENCES `members` (`id`)",
                )
                const original = await indexes(queryRunner, "essays")

                queryRunner.clearSqlMemory()
                await queryRunner.renameTable("essays", "papers")

                const papers = await queryRunner.getTable("papers")
                expect(
                    papers!.foreignKeys
                        .map((foreignKey) => foreignKey.name)
                        .sort(),
                ).to.deep.equal([fk("papers"), "fk_essays_member"].sort())
                expect(await indexes(queryRunner, "papers")).to.deep.equal(
                    ["PRIMARY(id)", `${fk("papers")}(authorId)`].sort(),
                )

                await queryRunner.executeMemoryDownSql()
                expect(await indexes(queryRunner, "essays")).to.deep.equal(
                    original,
                )
                await queryRunner.release()
            }),
        ))

    it("leaves a hand-named foreign key and its index untouched", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `notes` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, " +
                        "CONSTRAINT `fk_notes_author` FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`))",
                )
                await detachSupportIndex(
                    queryRunner,
                    "`notes`",
                    "fk_notes_author",
                    "FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`)",
                )

                await queryRunner.renameTable("notes", "memos")

                const memos = await queryRunner.getTable("memos")
                expect(
                    memos!.foreignKeys.map((foreignKey) => foreignKey.name),
                ).to.deep.equal(["fk_notes_author"])
                expect(await indexes(queryRunner, "memos")).to.deep.equal(
                    ["PRIMARY(id)", "fk_notes_author(authorId)"].sort(),
                )
                await queryRunner.release()
            }),
        ))

    it("renames the FK index of a table addressed as database.table", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                // A unique name, created without IF NOT EXISTS, so the cleanup
                // below can only ever drop the database this callback created
                const database = `rename_fk_${Math.random().toString(36).slice(2, 10)}`
                await queryRunner.createDatabase(database)
                try {
                    await queryRunner.query(
                        `CREATE TABLE \`${database}\`.\`authors\` (\`id\` int NOT NULL PRIMARY KEY)`,
                    )
                    await queryRunner.query(
                        `CREATE TABLE \`${database}\`.\`stories\` (\`id\` int NOT NULL PRIMARY KEY, \`authorId\` int NOT NULL, ` +
                            `CONSTRAINT \`${fk(`${database}.stories`)}\` FOREIGN KEY (\`authorId\`) REFERENCES \`${database}\`.\`authors\` (\`id\`))`,
                    )
                    await detachSupportIndex(
                        queryRunner,
                        `\`${database}\`.\`stories\``,
                        fk(`${database}.stories`),
                        `FOREIGN KEY (\`authorId\`) REFERENCES \`${database}\`.\`authors\` (\`id\`)`,
                    )

                    await queryRunner.renameTable(
                        `${database}.stories`,
                        "tales",
                    )

                    expect(
                        await indexes(queryRunner, `${database}.tales`),
                    ).to.deep.equal(
                        [
                            "PRIMARY(id)",
                            `${fk(`${database}.tales`)}(authorId)`,
                        ].sort(),
                    )
                } finally {
                    await queryRunner.dropDatabase(database)
                    await queryRunner.release()
                }
            }),
        ))

    it("renames the FK index of an existing table in sql-memory mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)
                await queryRunner.query(
                    "CREATE TABLE `letters` (`id` int NOT NULL PRIMARY KEY, `authorId` int NOT NULL, " +
                        `CONSTRAINT \`${fk("letters")}\` FOREIGN KEY (\`authorId\`) REFERENCES \`authors\` (\`id\`))`,
                )
                await detachSupportIndex(
                    queryRunner,
                    "`letters`",
                    fk("letters"),
                    "FOREIGN KEY (`authorId`) REFERENCES `authors` (`id`)",
                )
                const original = await indexes(queryRunner, "letters")

                queryRunner.enableSqlMemory()
                await queryRunner.renameTable("letters", "messages")
                expect(
                    queryRunner
                        .getMemorySql()
                        .upQueries.map(({ query }) => query)
                        .join(" "),
                ).to.include(`DROP INDEX \`${fk("letters")}\``)

                await queryRunner.executeMemoryUpSql()
                expect(await indexes(queryRunner, "messages")).to.deep.equal(
                    ["PRIMARY(id)", `${fk("messages")}(authorId)`].sort(),
                )

                await queryRunner.executeMemoryDownSql()
                queryRunner.disableSqlMemory()
                expect(await indexes(queryRunner, "letters")).to.deep.equal(
                    original,
                )
                await queryRunner.release()
            }),
        ))

    it("renames a table created only in planned sql in sql-memory mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const fk = (table: string) =>
                    dataSource.namingStrategy.foreignKeyName(table, [
                        "authorId",
                    ])
                await createAuthors(queryRunner)

                const comments = new Table({
                    name: "comments",
                    columns: [
                        { name: "id", type: "int", isPrimary: true },
                        { name: "authorId", type: "int" },
                    ],
                    foreignKeys: [
                        {
                            name: fk("comments"),
                            columnNames: ["authorId"],
                            referencedTableName: "authors",
                            referencedColumnNames: ["id"],
                        },
                    ],
                })

                queryRunner.enableSqlMemory()
                const query = sinon.spy(queryRunner, "query")
                try {
                    await queryRunner.createTable(comments)
                    await queryRunner.renameTable(comments, "remarks")
                    expect(query.called).to.equal(false)
                } finally {
                    query.restore()
                }

                const upQueries = queryRunner
                    .getMemorySql()
                    .upQueries.map(({ query }) => query)
                expect(upQueries).to.include(
                    "RENAME TABLE `comments` TO `remarks`",
                )
                expect(upQueries.join(" ")).to.not.include("DROP INDEX")

                await queryRunner.executeMemoryUpSql()
                queryRunner.disableSqlMemory()
                expect(await indexes(queryRunner, "remarks")).to.deep.equal(
                    ["PRIMARY(id)", `${fk("remarks")}(authorId)`].sort(),
                )
                await queryRunner.release()
            }),
        ))
})
