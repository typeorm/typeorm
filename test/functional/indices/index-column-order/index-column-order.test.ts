import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../utils/test-utils"
import { Project } from "./entity/Project"
import { UniqueProject } from "./entity/UniqueProject"
import { UniqueProjectPropertyLevel } from "./entity/UniqueProjectPropertyLevel"
import { Category } from "./entity/Category"
import { ProjectWithRelation } from "./entity/ProjectWithRelation"
import { UniqueProjectWithRelation } from "./entity/UniqueProjectWithRelation"
import { DualOrderProject } from "./entity/DualOrderProject"

describe("indices > index column order > @Index with per-column DESC/ASC ordering", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Project],
            schemaCreate: false,
            dropSchema: true,
            disabledDrivers: ["mongodb", "spanner"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should generate CREATE INDEX SQL with per-column DESC and ASC ordering", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const createIndex = sqlInMemory.upQueries.find((q) =>
                    /idx_project_3336(?!_col)/.test(q.query),
                )

                expect(
                    createIndex,
                    `Expected a CREATE INDEX query for idx_project_3336 on driver ${dataSource.driver.options.type}`,
                ).to.not.be.undefined

                const { type } = dataSource.driver.options

                if (type === "postgres") {
                    expect(createIndex!.query).to.equal(
                        `CREATE INDEX "idx_project_3336" ON "project"  ("semesterYear" DESC, "semesterSeason" ASC, "id") `,
                    )
                } else if (
                    type === "mysql" ||
                    type === "mariadb" ||
                    type === "aurora-mysql"
                ) {
                    expect(createIndex!.query).to.include(
                        "INDEX `idx_project_3336` (`semesterYear` DESC, `semesterSeason` ASC, `id`)",
                    )
                } else {
                    expect(createIndex!.query).to.include("DESC")
                    expect(createIndex!.query).to.include("ASC")
                }
            }),
        ))

    it("should generate CREATE INDEX SQL with DESC order from property-level @Index({ order })", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const createIndex = sqlInMemory.upQueries.find((q) =>
                    q.query.includes("idx_project_3336_col"),
                )

                expect(
                    createIndex,
                    `Expected a CREATE INDEX query for idx_project_3336_col on driver ${dataSource.driver.options.type}`,
                ).to.not.be.undefined

                const { type } = dataSource.driver.options

                if (type === "postgres") {
                    expect(createIndex!.query).to.equal(
                        `CREATE INDEX "idx_project_3336_col" ON "project"  ("score" DESC) `,
                    )
                } else if (
                    type === "mysql" ||
                    type === "mariadb" ||
                    type === "aurora-mysql"
                ) {
                    expect(createIndex!.query).to.include(
                        "INDEX `idx_project_3336_col` (`score` DESC)",
                    )
                } else {
                    expect(createIndex!.query).to.include("DESC")
                }
            }),
        ))

    it("should synchronize the index without errors", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options

                await dataSource.driver.createSchemaBuilder().build()

                const sqlAfterSync = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const recreateIndex = sqlAfterSync.upQueries.find((q) =>
                    q.query.includes("idx_project_3336"),
                )

                expect(
                    recreateIndex,
                    `idx_project_3336 should already exist and not require recreation for driver ${type}`,
                ).to.be.undefined
            }),
        ))

    it("should detect a sort order mismatch and schedule index recreation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options

                // Start from a clean state
                await dataSource.driver.createSchemaBuilder().build()

                // Check whether this driver actually stored DESC. Databases
                // that silently ignore DESC (MySQL < 8.0, MariaDB) will show
                // all-ASC even after a DESC build — column order detection
                // cannot work there and the rest of this test is not applicable.
                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.connect()
                    const [loadedTable] = await queryRunner.getTables([
                        "project",
                    ])
                    const builtIndex = loadedTable.indices.find(
                        (i) => i.name === "idx_project_3336",
                    )
                    const storedSemesterYearOrder =
                        builtIndex?.columnOrders?.["semesterYear"]

                    if (storedSemesterYearOrder !== "DESC") {
                        // Driver does not persist DESC — skip this assertion.
                        return
                    }

                    // Swap the ordering so the DB diverges from the entity:
                    // entity: semesterYear DESC, semesterSeason ASC
                    // DB:     semesterYear ASC,  semesterSeason DESC
                    await queryRunner.dropIndex("project", "idx_project_3336")
                    if (
                        type === "mysql" ||
                        type === "mariadb" ||
                        type === "aurora-mysql"
                    ) {
                        await queryRunner.query(
                            "CREATE INDEX `idx_project_3336` ON `project` (`semesterYear` ASC, `semesterSeason` DESC, `id` ASC)",
                        )
                    } else {
                        await queryRunner.query(
                            `CREATE INDEX "idx_project_3336" ON "project" ("semesterYear" ASC, "semesterSeason" DESC, "id" ASC)`,
                        )
                    }
                } finally {
                    await queryRunner.release()
                }

                // log() should now detect the mismatch and want to recreate.
                const sqlAfterMismatch = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const recreateIndex = sqlAfterMismatch.upQueries.find((q) =>
                    q.query.includes("idx_project_3336"),
                )

                expect(
                    recreateIndex,
                    `Expected a recreation query for idx_project_3336 due to order mismatch on driver ${type}`,
                ).to.not.be.undefined
            }),
        ))
})

/**
 * Drivers that emit DESC in their unique constraint / unique-index SQL.
 * - mssql:                CONSTRAINT name UNIQUE (col DESC) is valid SQL Server syntax
 * - mysql/mariadb/aurora: uniques become unique indexes, which support DESC
 * - sap:                  same, unique constraints become CREATE UNIQUE INDEX
 * Drivers that silently drop the ordering (constraint syntax doesn't support DESC):
 * - postgres, oracle, cockroachdb, sqlite
 */
const DRIVERS_WITH_UNIQUE_DESC_SUPPORT = [
    "mssql",
    "mysql",
    "mariadb",
    "aurora-mysql",
    "sap",
]

describe("indices > index column order > @Unique with per-column DESC ordering", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [UniqueProject],
            schemaCreate: false,
            dropSchema: true,
            disabledDrivers: ["mongodb", "spanner"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should generate unique constraint SQL with DESC ordering on supported drivers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const uniqueSql = sqlInMemory.upQueries.find((q) =>
                    q.query.includes("uniq_unique_project_3336"),
                )

                expect(
                    uniqueSql,
                    `Expected a query for uniq_unique_project_3336 on driver ${type}`,
                ).to.not.be.undefined

                if (DRIVERS_WITH_UNIQUE_DESC_SUPPORT.includes(type as string)) {
                    expect(
                        uniqueSql!.query,
                        `Expected DESC in unique SQL on driver ${type}`,
                    ).to.include("DESC")
                }
            }),
        ))
})

describe("indices > index column order > property-level @Unique with order option", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [UniqueProjectPropertyLevel],
            schemaCreate: false,
            dropSchema: true,
            disabledDrivers: ["mongodb", "spanner"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should generate DESC for @Unique(name, { order: 'DESC' }) at property level on supported drivers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const uniqueSql = sqlInMemory.upQueries.find((q) =>
                    q.query.includes("uq_property_level_3336"),
                )

                expect(
                    uniqueSql,
                    `Expected a query for uq_property_level_3336 on driver ${type}`,
                ).to.not.be.undefined

                if (DRIVERS_WITH_UNIQUE_DESC_SUPPORT.includes(type as string)) {
                    expect(
                        uniqueSql!.query,
                        `Expected DESC in unique SQL on driver ${type}`,
                    ).to.include("DESC")
                }
            }),
        ))

    it("should not recreate the unique after sync", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options

                await dataSource.driver.createSchemaBuilder().build()

                const sqlAfterSync = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const recreate = sqlAfterSync.upQueries.find((q) =>
                    q.query.includes("uq_property_level_3336"),
                )

                expect(
                    recreate,
                    `uq_property_level_3336 should not require recreation after sync on driver ${type}`,
                ).to.be.undefined
            }),
        ))
})

describe("indices > index column order > @Index on relation property with per-column order", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, ProjectWithRelation],
            schemaCreate: false,
            dropSchema: true,
            disabledDrivers: ["mongodb", "spanner"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should resolve join-column ordering into columnOrderMap", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityMetadata = dataSource.entityMetadatas.find(
                    (m) => m.targetName === "ProjectWithRelation",
                )!
                const indexMetadata = entityMetadata.indices.find(
                    (i) => i.name === "idx_project_relation_3336",
                )!

                expect(
                    indexMetadata.columnOrderMap,
                    `columnOrderMap should contain category_id DESC on driver ${dataSource.driver.options.type}`,
                ).to.deep.include({ category_id: "DESC" })
            }),
        ))

    it("should generate CREATE INDEX SQL with DESC for the join column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const createIndex = sqlInMemory.upQueries.find((q) =>
                    q.query.includes("idx_project_relation_3336"),
                )

                expect(
                    createIndex,
                    `Expected CREATE INDEX for idx_project_relation_3336 on driver ${type}`,
                ).to.not.be.undefined

                if (dataSource.driver.isDescIndexOrderingSupported()) {
                    expect(
                        createIndex!.query,
                        `Expected DESC in CREATE INDEX on driver ${type}`,
                    ).to.include("DESC")
                }
            }),
        ))

    it("should not recreate the relation index after sync", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options

                await dataSource.driver.createSchemaBuilder().build()

                const sqlAfterSync = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const recreate = sqlAfterSync.upQueries.find((q) =>
                    q.query.includes("idx_project_relation_3336"),
                )

                expect(
                    recreate,
                    `idx_project_relation_3336 should not require recreation after sync on driver ${type}`,
                ).to.be.undefined
            }),
        ))
})

describe("indices > index column order > two indexes on the same column with opposite orders", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [DualOrderProject],
            schemaCreate: false,
            dropSchema: true,
            disabledDrivers: ["mongodb", "spanner"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should create two indexes with distinct generated names when syncing", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options

                await dataSource.driver.createSchemaBuilder().build()

                const queryRunner = dataSource.createQueryRunner()
                try {
                    await queryRunner.connect()
                    const [loadedTable] = await queryRunner.getTables([
                        "dual_order_project",
                    ])

                    const scoreIndexes = loadedTable.indices.filter((i) =>
                        i.columnNames.includes("score"),
                    )

                    expect(
                        scoreIndexes.length,
                        `Expected 2 indexes on column 'score' on driver ${type}`,
                    ).to.equal(2)

                    expect(
                        scoreIndexes[0].name,
                        "Both indexes should have distinct generated names",
                    ).to.not.equal(scoreIndexes[1].name)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should not recreate the two indexes after a second sync", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options

                // Derive the generated names from the entity metadata
                const entityMetadata = dataSource.entityMetadatas.find(
                    (m) => m.targetName === "DualOrderProject",
                )!
                const indexNames = entityMetadata.indices.map((i) => i.name)

                await dataSource.driver.createSchemaBuilder().build()

                const sqlAfterSync = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                for (const name of indexNames) {
                    const recreate = sqlAfterSync.upQueries.find((q) =>
                        q.query.includes(name),
                    )
                    expect(
                        recreate,
                        `Index ${name} should not require recreation after sync on driver ${type}`,
                    ).to.be.undefined
                }
            }),
        ))
})

describe("indices > index column order > @Unique on relation property with per-column order", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, UniqueProjectWithRelation],
            schemaCreate: false,
            dropSchema: true,
            disabledDrivers: ["mongodb", "spanner"],
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should resolve join-column ordering into columnOrderMap", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityMetadata = dataSource.entityMetadatas.find(
                    (m) => m.targetName === "UniqueProjectWithRelation",
                )!
                // For MySQL-family drivers @Unique is stored as IndexMetadata
                // in entityMetadata.indices, not in entityMetadata.uniques.
                const uniqueMetadata =
                    entityMetadata.uniques.find(
                        (u) => u.name === "uniq_project_relation_3336",
                    ) ??
                    entityMetadata.indices.find(
                        (i) => i.name === "uniq_project_relation_3336",
                    )

                expect(
                    uniqueMetadata?.columnOrderMap,
                    `columnOrderMap should contain category_id DESC on driver ${dataSource.driver.options.type}`,
                ).to.deep.include({ category_id: "DESC" })
            }),
        ))

    it("should generate unique constraint SQL with DESC for the join column on supported drivers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { type } = dataSource.driver.options
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const uniqueSql = sqlInMemory.upQueries.find((q) =>
                    q.query.includes("uniq_project_relation_3336"),
                )

                expect(
                    uniqueSql,
                    `Expected a query for uniq_project_relation_3336 on driver ${type}`,
                ).to.not.be.undefined

                if (DRIVERS_WITH_UNIQUE_DESC_SUPPORT.includes(type as string)) {
                    expect(
                        uniqueSql!.query,
                        `Expected DESC in unique SQL on driver ${type}`,
                    ).to.include("DESC")
                }
            }),
        ))
})
