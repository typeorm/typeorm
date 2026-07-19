import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Post } from "./entity/Post"

// Regression test for issue #3357: migration should ALTER COLUMN TYPE
// instead of DROP+ADD when only column length changes
describe("schema builder > change column > column length safe", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate ALTER COLUMN TYPE when length changes, not DROP + ADD", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                const textColumn =
                    postMetadata.findColumnWithPropertyName("text")!

                nameColumn.length = "200"
                textColumn.length = "100"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) => q.query)

                const driverType = dataSource.driver.options.type

                if (driverType === "postgres" || driverType === "cockroachdb") {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                        expect(query).to.not.include("ADD COLUMN")
                    }
                    expect(
                        upQueries.some((q) =>
                            q.includes('ALTER COLUMN "name" TYPE'),
                        ),
                    ).to.be.true
                    expect(
                        upQueries.some((q) =>
                            q.includes('ALTER COLUMN "text" TYPE'),
                        ),
                    ).to.be.true
                } else if (
                    driverType === "mysql" ||
                    driverType === "mariadb" ||
                    driverType === "aurora-mysql"
                ) {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                    }
                    expect(upQueries.some((q) => q.includes("ALTER TABLE"))).to
                        .be.true
                } else if (driverType === "oracle") {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                    }
                    expect(upQueries.some((q) => q.includes("MODIFY"))).to.be
                        .true
                } else if (driverType === "sap") {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                    }
                } else if (driverType === "mssql") {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                    }
                }

                nameColumn.length = "100"
                textColumn.length = "50"
            }),
        ))

    it("should generate ALTER COLUMN TYPE when length decreases, not DROP + ADD", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                const textColumn =
                    postMetadata.findColumnWithPropertyName("text")!

                nameColumn.length = "50"
                textColumn.length = "25"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) => q.query)
                const driverType = dataSource.driver.options.type

                if (driverType === "postgres" || driverType === "cockroachdb") {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                        expect(query).to.not.include("ADD COLUMN")
                    }
                    expect(
                        upQueries.some((q) =>
                            q.includes('ALTER COLUMN "name" TYPE'),
                        ),
                    ).to.be.true
                } else if (
                    driverType === "mysql" ||
                    driverType === "mariadb" ||
                    driverType === "aurora-mysql" ||
                    driverType === "oracle" ||
                    driverType === "sap" ||
                    driverType === "mssql"
                ) {
                    for (const query of upQueries) {
                        expect(query).to.not.include("DROP COLUMN")
                    }
                }

                nameColumn.length = "100"
                textColumn.length = "50"
            }),
        ))

    it("should verify data is preserved after length change (no DROP COLUMN)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                try {
                    const table = await queryRunner.getTable("post")
                    const nameCol = table!.findColumnByName("name")!
                    const textCol = table!.findColumnByName("text")!

                    const newNameCol = nameCol.clone()
                    const newTextCol = textCol.clone()
                    newNameCol.length = "200"
                    newTextCol.length = "100"

                    await queryRunner.changeColumn(table!, nameCol, newNameCol)
                    await queryRunner.changeColumn(table!, textCol, newTextCol)

                    const updatedTable = await queryRunner.getTable("post")
                    expect(
                        updatedTable!.findColumnByName("name")!.length,
                    ).to.equal("200")
                    expect(
                        updatedTable!.findColumnByName("text")!.length,
                    ).to.equal("100")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
