import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { DriverUtils } from "../../../../../../src/driver/DriverUtils"

describe("schema builder > column change strategy > execution", () => {
    describe("synchronize with 'auto' strategy applies changes correctly", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "mariadb"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("widening VARCHAR preserves existing data", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('hello world', 42, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "500"

                    await dataSource.synchronize(false)

                    const rows = await dataSource.query(
                        `SELECT title FROM \`post\``,
                    )
                    expect(rows[0].title).to.equal("hello world")

                    const columns = await dataSource.query(
                        `SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'post' AND COLUMN_NAME = 'title' AND TABLE_SCHEMA = DATABASE()`,
                    )
                    expect(
                        Number(columns[0].CHARACTER_MAXIMUM_LENGTH),
                    ).to.equal(500)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("widening INT type preserves existing data", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('test', 2147483647, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!
                    viewsCol.changeStrategy = "auto"
                    viewsCol.type = "bigint"

                    await dataSource.synchronize(false)

                    const rows = await dataSource.query(
                        `SELECT views FROM \`post\``,
                    )
                    expect(Number(rows[0].views)).to.equal(2147483647)

                    const columns = await dataSource.query(
                        `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'post' AND COLUMN_NAME = 'views' AND TABLE_SCHEMA = DATABASE()`,
                    )
                    expect(columns[0].DATA_TYPE).to.equal("bigint")

                    // revert
                    viewsCol.type = "int"
                    viewsCol.changeStrategy = undefined
                }),
            ))

        it("narrowing VARCHAR uses DROP+ADD (data lost)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('short', 1, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "100"

                    await dataSource.synchronize(false)

                    const columns = await dataSource.query(
                        `SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'post' AND COLUMN_NAME = 'title' AND TABLE_SCHEMA = DATABASE()`,
                    )
                    expect(
                        Number(columns[0].CHARACTER_MAXIMUM_LENGTH),
                    ).to.equal(100)

                    // DROP+ADD drops and re-adds column; original data lost
                    const rows = await dataSource.query(
                        `SELECT title FROM \`post\``,
                    )
                    expect(rows[0].title).to.not.equal("short")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("ENUM append preserves existing data", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('test', 1, 1, 'published', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const statusCol =
                        metadata.findColumnWithPropertyName("status")!
                    statusCol.changeStrategy = "auto"
                    statusCol.enum = [
                        "draft",
                        "published",
                        "archived",
                        "deleted",
                    ]

                    await dataSource.synchronize(false)

                    const rows = await dataSource.query(
                        `SELECT status FROM \`post\``,
                    )
                    expect(rows[0].status).to.equal("published")

                    // revert
                    statusCol.enum = ["draft", "published", "archived"]
                    statusCol.changeStrategy = undefined
                }),
            ))
    })

    describe("synchronize with 'alter' strategy", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "mariadb"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("narrowing with 'alter' preserves data (DB enforces)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('short', 1, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "alter"
                    titleCol.length = "100"

                    await dataSource.synchronize(false)

                    const rows = await dataSource.query(
                        `SELECT title FROM \`post\``,
                    )
                    expect(rows[0].title).to.equal("short")

                    const columns = await dataSource.query(
                        `SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'post' AND COLUMN_NAME = 'title' AND TABLE_SCHEMA = DATABASE()`,
                    )
                    expect(
                        Number(columns[0].CHARACTER_MAXIMUM_LENGTH),
                    ).to.equal(100)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))
    })

    describe("default (no strategy) backward compat", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "mariadb"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("type change without strategy uses DROP+ADD (data lost)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('test', 99, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!
                    viewsCol.type = "bigint"

                    await dataSource.synchronize(false)

                    const columns = await dataSource.query(
                        `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'post' AND COLUMN_NAME = 'views' AND TABLE_SCHEMA = DATABASE()`,
                    )
                    expect(columns[0].DATA_TYPE).to.equal("bigint")

                    // Data column was dropped+added — default value applied
                    const rows = await dataSource.query(
                        `SELECT views FROM \`post\``,
                    )
                    expect(Number(rows[0].views)).to.not.equal(99)

                    // revert
                    viewsCol.type = "int"
                }),
            ))

        it("synchronize is idempotent after change applied", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "500"

                    await dataSource.synchronize(false)

                    // Second sync should produce no queries
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const titleQueries = sqlInMemory.upQueries.filter((q) =>
                        q.query.includes("title"),
                    )
                    expect(titleQueries).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))
    })

    describe("classification and edge cases", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "mariadb"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("UNSIGNED to signed classifies as narrow", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `ALTER TABLE \`post\` ADD COLUMN \`counter\` int unsigned NOT NULL DEFAULT 0`,
                    )

                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("post")
                    const counterCol = table!.findColumnByName("counter")!
                    const newCol = counterCol.clone()
                    newCol.unsigned = false

                    const classification = (
                        queryRunner as any
                    ).classifyColumnChange(counterCol, newCol, table)
                    expect(classification).to.equal("narrow")

                    await dataSource.query(
                        `ALTER TABLE \`post\` DROP COLUMN \`counter\``,
                    )
                    await queryRunner.release()
                }),
            ))

        it("VIRTUAL generated column addition uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!
                    const originalGeneratedType = viewsCol.generatedType
                    const originalAsExpression = viewsCol.asExpression
                    viewsCol.generatedType = "VIRTUAL"
                    viewsCol.asExpression = "`score` + 1"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("views"),
                    )
                    expect(dropQuery).to.exist

                    // revert
                    viewsCol.generatedType = originalGeneratedType
                    viewsCol.asExpression = originalAsExpression
                }),
            ))

        it("SET column member removal with composite values uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 1, 'draft', 1.0, 'a', 'read,admin')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const flagsCol =
                        metadata.findColumnWithPropertyName("flags")!
                    const originalEnum = flagsCol.enum
                    flagsCol.enum = ["read", "write"]
                    flagsCol.changeStrategy = "auto"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("flags"),
                    )
                    expect(dropQuery).to.exist

                    // revert
                    flagsCol.enum = originalEnum
                    flagsCol.changeStrategy = undefined
                }),
            ))
    })
})
