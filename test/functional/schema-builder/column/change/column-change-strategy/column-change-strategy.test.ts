import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { DriverUtils } from "../../../../../../src/driver/DriverUtils"

describe("schema builder > column change strategy", () => {
    describe("'alter' mode - widening uses CHANGE, narrowing warned", () => {
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

        it("widening VARCHAR length emits CHANGE instead of DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "alter"
                    titleCol.length = "500"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")
                    expect(upQuery!.query).to.contain("varchar(500)")

                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("widening INT type emits CHANGE instead of DROP+ADD", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!
                    viewsCol.changeStrategy = "alter"
                    viewsCol.type = "bigint"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("views"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")
                    expect(upQuery!.query).to.contain("bigint")

                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    viewsCol.type = "int"
                    viewsCol.changeStrategy = undefined
                }),
            ))

        it("narrowing VARCHAR length emits CHANGE with warning", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "alter"
                    titleCol.length = "50"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("narrow")
                    expect(sqlInMemory.warnings[0]).to.contain("title")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("ENUM append emits CHANGE (widen)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const statusCol =
                        metadata.findColumnWithPropertyName("status")!
                    statusCol.changeStrategy = "alter"
                    statusCol.enum = [
                        "draft",
                        "published",
                        "archived",
                        "deleted",
                    ]

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("status"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")

                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    statusCol.enum = ["draft", "published", "archived"]
                    statusCol.changeStrategy = undefined
                }),
            ))
    })

    describe("default (no strategy) - DROP+ADD behavior unchanged", () => {
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

        it("type change still uses DROP+ADD when no strategy set", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!
                    viewsCol.type = "bigint"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("views"),
                    )
                    expect(dropQuery).to.exist

                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    viewsCol.type = "int"
                }),
            ))
    })

    describe("'auto' mode - narrowing checks data", () => {
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

        it("narrowing VARCHAR with data that fits emits CHANGE", () =>
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

        it("narrowing VARCHAR with data that exceeds uses DROP+ADD", () =>
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

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("title"),
                    )
                    expect(dropQuery).to.exist

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("narrow")

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))
    })
})
