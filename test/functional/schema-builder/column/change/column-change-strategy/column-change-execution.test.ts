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

        it("narrowing VARCHAR with fitting data preserves rows", () =>
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

        it("narrowing VARCHAR with exceeding data uses DROP+ADD (data lost)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const longTitle = "x".repeat(120)
                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('${longTitle}', 1, 1, 'draft', 1.0, 'a', 'read')`,
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

                    // Data is gone due to DROP+ADD
                    const rows = await dataSource.query(
                        `SELECT title FROM \`post\``,
                    )
                    expect(rows[0].title).to.not.equal(longTitle)

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

        it("narrowing with 'alter' strategy still applies CHANGE (DB enforces)", () =>
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

    describe("migration generation output", () => {
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

        it("'auto' widen generates symmetric up/down CHANGE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "500"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const up = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    const down = sqlInMemory.downQueries.find((q) =>
                        q.query.includes("title"),
                    )

                    expect(up).to.exist
                    expect(up!.query).to.contain("CHANGE")
                    expect(up!.query).to.contain("varchar(500)")

                    expect(down).to.exist
                    expect(down!.query).to.contain("CHANGE")
                    expect(down!.query).to.contain("varchar(255)")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("'auto' narrow with exceeding data generates DROP+ADD up and down", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const longTitle = "x".repeat(120)
                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('${longTitle}', 1, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "100"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upDrop = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("title"),
                    )
                    const upAdd = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("ADD") &&
                            q.query.includes("title"),
                    )
                    expect(upDrop).to.exist
                    expect(upAdd).to.exist

                    const downDrop = sqlInMemory.downQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("title"),
                    )
                    const downAdd = sqlInMemory.downQueries.find(
                        (q) =>
                            q.query.includes("ADD") &&
                            q.query.includes("title"),
                    )
                    expect(downDrop).to.exist
                    expect(downAdd).to.exist

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("Check:")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("'auto' narrow with fitting data generates symmetric CHANGE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('hi', 1, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "100"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const up = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    const down = sqlInMemory.downQueries.find((q) =>
                        q.query.includes("title"),
                    )

                    expect(up).to.exist
                    expect(up!.query).to.contain("CHANGE")
                    expect(up!.query).to.contain("varchar(100)")
                    expect(up!.query).not.to.contain("DROP")

                    expect(down).to.exist
                    expect(down!.query).to.contain("CHANGE")
                    expect(down!.query).to.contain("varchar(255)")

                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("warnings include the data-check query for narrow+exceeds", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const longTitle = "x".repeat(120)
                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('${longTitle}', 1, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "100"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("CHAR_LENGTH")
                    expect(sqlInMemory.warnings[0]).to.contain("100")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))
    })

    describe("data-aware strategy resolution", () => {
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

        it("INT downgrade with auto - data fits uses CHANGE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 100, 'draft', 1.5, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const scoreCol =
                        metadata.findColumnWithPropertyName("score")!
                    scoreCol.changeStrategy = "auto"
                    scoreCol.type = "int"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("score"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")

                    // revert
                    scoreCol.type = "bigint"
                    scoreCol.changeStrategy = undefined
                }),
            ))

        it("INT downgrade with auto - data exceeds uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 3000000000, 'draft', 1.5, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const scoreCol =
                        metadata.findColumnWithPropertyName("score")!
                    scoreCol.changeStrategy = "auto"
                    scoreCol.type = "int"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("score"),
                    )
                    expect(dropQuery).to.exist
                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)

                    // revert
                    scoreCol.type = "bigint"
                    scoreCol.changeStrategy = undefined
                }),
            ))

        it("UNSIGNED to signed with auto - data fits uses CHANGE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `ALTER TABLE \`post\` ADD COLUMN \`counter\` int unsigned NOT NULL DEFAULT 0`,
                    )
                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`, \`counter\`) VALUES ('t', 1, 1, 'draft', 1.0, 'a', 'read', 100)`,
                    )

                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("post")
                    const counterCol = table!.findColumnByName("counter")!
                    const oldCol = counterCol.clone()
                    const newCol = counterCol.clone()
                    newCol.unsigned = false

                    const classification = (
                        queryRunner as any
                    ).classifyColumnChange(oldCol, newCol, table)
                    expect(classification).to.equal("narrow")

                    await dataSource.query(
                        `ALTER TABLE \`post\` DROP COLUMN \`counter\``,
                    )
                    await queryRunner.release()
                }),
            ))

        it("UNSIGNED to signed with auto - data exceeds signed max uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `ALTER TABLE \`post\` ADD COLUMN \`counter\` int unsigned NOT NULL DEFAULT 0`,
                    )
                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`, \`counter\`) VALUES ('t', 1, 1, 'draft', 1.0, 'a', 'read', 3000000000)`,
                    )

                    const queryRunner = dataSource.createQueryRunner()
                    const table = await queryRunner.getTable("post")
                    const counterCol = table!.findColumnByName("counter")!
                    const newCol = counterCol.clone()
                    newCol.unsigned = false

                    const query = (queryRunner as any).buildDataCheckQuery(
                        table,
                        counterCol,
                        newCol,
                    )
                    expect(query).to.contain("> 2147483647")

                    const result = await dataSource.query(query)
                    const exists = Object.values(result[0])[0]
                    expect(Number(exists)).to.equal(1)

                    await dataSource.query(
                        `ALTER TABLE \`post\` DROP COLUMN \`counter\``,
                    )
                    await queryRunner.release()
                }),
            ))

        it("incompatible type change with auto uses DROP+ADD with warning", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.type = "int"
                    titleCol.length = ""

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("title"),
                    )
                    expect(dropQuery).to.exist
                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("incompatible")

                    // revert
                    titleCol.type = "varchar"
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("empty table narrowing always uses CHANGE (no rows to violate)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "10"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")
                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("ENUM remove with data using removed value uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 1, 'archived', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const statusCol =
                        metadata.findColumnWithPropertyName("status")!
                    statusCol.changeStrategy = "auto"
                    statusCol.enum = ["draft", "published"]

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("status"),
                    )
                    expect(dropQuery).to.exist
                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)

                    // revert
                    statusCol.enum = ["draft", "published", "archived"]
                    statusCol.changeStrategy = undefined
                }),
            ))

        it("nullable to NOT NULL with NULLs present uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`subtitle\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 1, 'draft', NULL, 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const subtitleCol =
                        metadata.findColumnWithPropertyName("subtitle")!
                    subtitleCol.changeStrategy = "auto"
                    subtitleCol.isNullable = false

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("subtitle"),
                    )
                    expect(dropQuery).to.exist
                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)

                    // revert
                    subtitleCol.isNullable = true
                    subtitleCol.changeStrategy = undefined
                }),
            ))

        it("nullable to NOT NULL without NULLs uses CHANGE", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`subtitle\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 1, 'draft', 'has value', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const subtitleCol =
                        metadata.findColumnWithPropertyName("subtitle")!
                    subtitleCol.changeStrategy = "auto"
                    subtitleCol.isNullable = false

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("subtitle"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")

                    // revert
                    subtitleCol.isNullable = true
                    subtitleCol.changeStrategy = undefined
                }),
            ))

        it("no-change produces zero queries", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const titleQueries = sqlInMemory.upQueries.filter((q) =>
                        q.query.includes("title"),
                    )
                    expect(titleQueries).to.have.length(0)
                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("per-column strategy isolation - one auto, one default", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('short', 1, 1, 'draft', 1.0, 'a', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!

                    titleCol.changeStrategy = "auto"
                    titleCol.length = "100"

                    // views has no strategy set - should DROP+ADD
                    viewsCol.type = "bigint"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    // title: auto + data fits = CHANGE
                    const titleUp = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("title") &&
                            q.query.includes("CHANGE"),
                    )
                    expect(titleUp).to.exist

                    // views: no strategy = DROP+ADD
                    const viewsDrop = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("views"),
                    )
                    expect(viewsDrop).to.exist

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                    viewsCol.type = "int"
                }),
            ))

        it("default strategy: length-only change uses DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.length = "100"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("title"),
                    )
                    expect(dropQuery).to.exist

                    // revert
                    titleCol.length = "255"
                }),
            ))

        it("default strategy: idempotency after sync", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!
                    viewsCol.type = "bigint"

                    await dataSource.synchronize(false)

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const viewsQueries = sqlInMemory.upQueries.filter((q) =>
                        q.query.includes("views"),
                    )
                    expect(viewsQueries).to.have.length(0)

                    // revert
                    viewsCol.type = "int"
                    await dataSource.synchronize(false)
                }),
            ))

        it("VARCHAR length widen with auto uses CHANGE (not DROP+ADD)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('t', 1, 1, 'draft', 1.0, 'hello', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const tagCol = metadata.findColumnWithPropertyName("tag")!
                    tagCol.changeStrategy = "auto"
                    tagCol.length = "200"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("tag"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")

                    // revert
                    tagCol.length = "50"
                    tagCol.changeStrategy = undefined
                }),
            ))

        it("decorator wiring: changeStrategy on column metadata is respected", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    await dataSource.query(
                        `INSERT INTO \`post\` (\`title\`, \`views\`, \`score\`, \`status\`, \`rating\`, \`tag\`, \`flags\`) VALUES ('hi', 1, 1, 'draft', 1.0, 'x', 'read')`,
                    )

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "auto"
                    titleCol.length = "500"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).to.contain("varchar(500)")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
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
