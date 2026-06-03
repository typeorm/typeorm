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
    describe("'alter' mode SQL output", () => {
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

        it("widening VARCHAR length emits CHANGE", () =>
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

        it("widening INT type emits CHANGE", () =>
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

        it("incompatible change emits CHANGE with DB-rejection warning", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "alter"
                    titleCol.type = "int"
                    titleCol.length = ""

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const upQuery = sqlInMemory.upQueries.find((q) =>
                        q.query.includes("title"),
                    )
                    expect(upQuery).to.exist
                    expect(upQuery!.query).to.contain("CHANGE")
                    expect(upQuery!.query).not.to.contain("DROP")

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("incompatible")
                    expect(sqlInMemory.warnings[0]).to.contain(
                        "database will reject if data does not fit",
                    )

                    // revert
                    titleCol.type = "varchar"
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

        it("nullable to NOT NULL warns DB may reject", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const subtitleCol =
                        metadata.findColumnWithPropertyName("subtitle")!
                    subtitleCol.changeStrategy = "alter"
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

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("narrow")
                    expect(sqlInMemory.warnings[0]).to.contain(
                        "database will reject if data does not fit",
                    )

                    // revert
                    subtitleCol.isNullable = true
                    subtitleCol.changeStrategy = undefined
                }),
            ))

        it("narrowing warns DB may reject (data loss risk)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.changeStrategy = "alter"
                    titleCol.length = "10"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain(
                        "database will reject if data does not fit",
                    )

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))
    })

    describe("'auto' mode SQL output", () => {
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

        it("widen generates symmetric up/down CHANGE", () =>
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

                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("narrow generates DROP+ADD with warning", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

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

                    expect(sqlInMemory.warnings.length).to.be.greaterThan(0)
                    expect(sqlInMemory.warnings[0]).to.contain("narrow")
                    expect(sqlInMemory.warnings[0]).to.contain(
                        "DROP+ADD to prevent potential data truncation",
                    )

                    // revert
                    titleCol.length = "255"
                    titleCol.changeStrategy = undefined
                }),
            ))

        it("incompatible generates DROP+ADD with warning", () =>
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

        it("INT downgrade emits DROP+ADD (narrow)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

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
                    expect(sqlInMemory.warnings[0]).to.contain("narrow")

                    // revert
                    scoreCol.type = "bigint"
                    scoreCol.changeStrategy = undefined
                }),
            ))

        it("ENUM remove emits DROP+ADD (narrow)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

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

        it("nullable to NOT NULL emits DROP+ADD (narrow)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

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

        it("per-column strategy isolation - auto widen vs default", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    const viewsCol =
                        metadata.findColumnWithPropertyName("views")!

                    titleCol.changeStrategy = "auto"
                    titleCol.length = "500"

                    viewsCol.type = "bigint"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    // title: auto + widen = CHANGE
                    const titleUp = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("title") &&
                            q.query.includes("CHANGE"),
                    )
                    expect(titleUp).to.exist

                    // views: no strategy + type change = DROP+ADD
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
    })

    describe("default (no strategy) SQL output - silent data loss", () => {
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

        it("type change uses DROP+ADD with no warning", () =>
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
                    // no warning emitted — data loss is silent
                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    viewsCol.type = "int"
                }),
            ))

        it("length-only change uses DROP+ADD with no warning", () =>
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
                    // no warning emitted — data loss is silent
                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                }),
            ))

        it("widen uses DROP+ADD with no warning (same as narrow)", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (!DriverUtils.isMySQLFamily(dataSource.driver)) return

                    const metadata = dataSource.getMetadata("Post")
                    const titleCol =
                        metadata.findColumnWithPropertyName("title")!
                    titleCol.length = "500"

                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()

                    const dropQuery = sqlInMemory.upQueries.find(
                        (q) =>
                            q.query.includes("DROP") &&
                            q.query.includes("title"),
                    )
                    expect(dropQuery).to.exist
                    // default treats all type/length changes the same — DROP+ADD
                    expect(sqlInMemory.warnings).to.have.length(0)

                    // revert
                    titleCol.length = "255"
                }),
            ))
    })
})
