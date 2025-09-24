/* eslint-disable @typescript-eslint/no-unused-expressions */
import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Group as ExplicitGroup } from "./entity/ExplicitGroup"
import { Group as PartialExplicitGroup } from "./entity/PartialExplicitGroup"
import { Group as FullyImplicitGroup } from "./entity/FullyImplicitGroup"
import { MemoryLogger } from "./memory-logger"

// Simple factory functions to create entities with generated IDs
function createEntity<T extends { id: string; tenantId: string }>(
    EntityClass: new () => T,
    tenantId: string = "tenant1",
): T {
    const entity = new EntityClass()
    entity.id = Math.random().toString(36).substring(2, 15) // Simple UUID alternative
    entity.tenantId = tenantId
    return entity
}

/**
 * Junction table column naming behavior tests
 *
 * This test suite focuses specifically on the issue described in PR #11686:
 * - Implicit column names should be renamed to avoid conflicts (backward compatibility)
 * - Explicit column names should be respected exactly as specified by the user
 *
 * This enables composite foreign key constraints in partitioned many-to-many relationships
 * by allowing shared columns when explicitly named by the user.
 */
describe("relations > junction table column naming", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqlite", "postgres"],
                createLogger: () => new MemoryLogger(true),
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("fully implicit column names (no configuration)", () => {
        it("should rename duplicate columns when no configuration is provided", () =>
            dataSources.forEach((dataSource) => {
                const groupMetadata = dataSource.getMetadata(FullyImplicitGroup)
                const parentsRelation =
                    groupMetadata.findRelationWithPropertyPath("parents")!
                const junctionMetadata = parentsRelation.junctionEntityMetadata!

                const columnNames = junctionMetadata.columns.map(
                    (col) => col.databaseName,
                )

                // Should have 4 columns with renamed duplicates
                expect(columnNames).to.have.length(4)

                // Should contain renamed columns to avoid conflicts
                expect(columnNames).to.include("groupId_1")
                expect(columnNames).to.include("groupTenantId_1")
                expect(columnNames).to.include("groupId_2")
                expect(columnNames).to.include("groupTenantId_2")
            }))

        it("should generate correct SQL with renamed columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const logger = dataSource.logger as MemoryLogger

                    // Setup test data
                    const parent = createEntity(FullyImplicitGroup)
                    const child = createEntity(FullyImplicitGroup)
                    await dataSource.manager.save([parent, child])

                    // Clear setup queries and test junction INSERT
                    logger.clear()

                    parent.children = [child]
                    await dataSource.manager.save(parent)

                    const insertQueries = logger.queries.filter(
                        (q) =>
                            q.includes("INSERT") &&
                            q.includes("group_parents_group_fully_implicit"),
                    )

                    expect(insertQueries).to.have.length(1)

                    const insertQuery = insertQueries[0]

                    // Parse INSERT column names using regex
                    const insertRegex =
                        /INSERT INTO "group_parents_group_fully_implicit"\("(\w+)", "(\w+)", "(\w+)", "(\w+)"\)/

                    const match = insertQuery.match(insertRegex)
                    expect(match, "insert column match").to.not.be.null
                    const columns = [match![1], match![2], match![3], match![4]]

                    // Validate we have exactly the expected columns
                    expect(columns).to.have.length(4)
                    expect(columns).to.include("groupId_1")
                    expect(columns).to.include("groupTenantId_1")
                    expect(columns).to.include("groupId_2")
                    expect(columns).to.include("groupTenantId_2")
                }),
            ))

        it("should work functionally with renamed columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parent = createEntity(FullyImplicitGroup)
                    const child1 = createEntity(FullyImplicitGroup)
                    const child2 = createEntity(FullyImplicitGroup)

                    await dataSource.manager.save([parent, child1, child2])

                    // Test adding relationships
                    parent.children = [child1, child2]
                    await dataSource.manager.save(parent)

                    let savedParent = await dataSource.manager.findOne(
                        FullyImplicitGroup,
                        {
                            where: {
                                id: parent.id,
                                tenantId: parent.tenantId,
                            },
                            relations: ["children"],
                        },
                    )

                    expect(savedParent?.children).to.have.length(2)

                    // Test updating relationships
                    parent.children = [child1]
                    await dataSource.manager.save(parent)

                    savedParent = await dataSource.manager.findOne(
                        FullyImplicitGroup,
                        {
                            where: {
                                id: parent.id,
                                tenantId: parent.tenantId,
                            },
                            relations: ["children"],
                        },
                    )

                    expect(savedParent?.children).to.have.length(1)
                    expect(savedParent?.children[0].id).to.equal(child1.id)
                }),
            ))
    })

    describe("partial explicit column names (arrays provided, no names)", () => {
        it("should rename duplicate columns when arrays are provided but no names specified", () =>
            dataSources.forEach((dataSource) => {
                const groupMetadata =
                    dataSource.getMetadata(PartialExplicitGroup)
                const parentsRelation =
                    groupMetadata.findRelationWithPropertyPath("parents")!
                const junctionMetadata = parentsRelation.junctionEntityMetadata!

                const columnNames = junctionMetadata.columns.map(
                    (col) => col.databaseName,
                )

                // Should have 4 columns with renamed duplicates (same as fully implicit)
                expect(columnNames).to.have.length(4)

                // Should contain renamed columns to avoid conflicts
                expect(columnNames).to.include("groupId_1")
                expect(columnNames).to.include("groupTenantId_1")
                expect(columnNames).to.include("groupId_2")
                expect(columnNames).to.include("groupTenantId_2")
            }))

        it("should generate correct SQL with renamed columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const logger = dataSource.logger as MemoryLogger

                    // Setup test data
                    const parent = createEntity(PartialExplicitGroup)
                    const child = createEntity(PartialExplicitGroup)
                    await dataSource.manager.save([parent, child])

                    // Clear setup queries and test junction INSERT
                    logger.clear()

                    parent.children = [child]
                    await dataSource.manager.save(parent)

                    const insertQueries = logger.queries.filter(
                        (q) =>
                            q.includes("INSERT") &&
                            q.includes("group_parents_group_partial_explicit"),
                    )

                    expect(insertQueries).to.have.length(1)

                    const insertQuery = insertQueries[0]

                    // Parse INSERT column names using regex
                    const insertRegex =
                        /INSERT INTO "group_parents_group_partial_explicit"\("(\w+)", "(\w+)", "(\w+)", "(\w+)"\)/

                    const match = insertQuery.match(insertRegex)
                    expect(match, "insert column match").to.not.be.null
                    const columns = [match![1], match![2], match![3], match![4]]

                    // Validate we have exactly the expected columns
                    expect(columns).to.have.length(4)
                    expect(columns).to.include("groupId_1")
                    expect(columns).to.include("groupTenantId_1")
                    expect(columns).to.include("groupId_2")
                    expect(columns).to.include("groupTenantId_2")
                }),
            ))

        it("should work functionally with renamed columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parent = createEntity(PartialExplicitGroup)
                    const child = createEntity(PartialExplicitGroup)

                    await dataSource.manager.save([parent, child])

                    // Test adding relationships
                    parent.children = [child]
                    await dataSource.manager.save(parent)

                    const savedParent = await dataSource.manager.findOne(
                        PartialExplicitGroup,
                        {
                            where: {
                                id: parent.id,
                                tenantId: parent.tenantId,
                            },
                            relations: ["children"],
                        },
                    )

                    expect(savedParent?.children).to.have.length(1)
                    expect(savedParent?.children[0].id).to.equal(child.id)
                }),
            ))
    })

    describe("explicit column names (new expected behavior)", () => {
        beforeEach(() =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // Manually create the junction table with shared columns
                    const queryRunner = dataSource.createQueryRunner()
                    await queryRunner.query(`CREATE TABLE "group_parents_group_shared_tenant" (
                        "tenant_id" VARCHAR(255) NOT NULL,
                        "parent_id" VARCHAR(255) NOT NULL,
                        "child_id" VARCHAR(255) NOT NULL,
                        PRIMARY KEY ("tenant_id", "parent_id", "child_id")
                    )`)
                    await queryRunner.release()
                }),
            ),
        )

        it("should respect explicit column names and create shared columns", () =>
            dataSources.forEach((dataSource) => {
                const groupMetadata = dataSource.getMetadata(ExplicitGroup)
                const parentsRelation =
                    groupMetadata.findRelationWithPropertyPath("parents")!
                const junctionMetadata = parentsRelation.junctionEntityMetadata!

                const columnNames = junctionMetadata.columns.map(
                    (col) => col.databaseName,
                )

                // Should have still 4 columns in the metadata (even though tenant_id is shared)
                expect(columnNames).to.have.length(4)

                // Should contain the exact column names specified by user
                expect(columnNames).to.include("tenant_id") // found twice
                expect(columnNames).to.include("parent_id")
                expect(columnNames).to.include("child_id")
            }))

        it("should generate correct SQL with shared columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const logger = dataSource.logger as MemoryLogger

                    // Setup test data
                    const parent = createEntity(ExplicitGroup)
                    const child = createEntity(ExplicitGroup)
                    await dataSource.manager.save([parent, child])

                    // Clear setup queries and test junction INSERT
                    logger.clear()

                    parent.children = [child]
                    await dataSource.manager.save(parent)

                    const insertQueries = logger.queries.filter(
                        (q) =>
                            q.includes("INSERT") &&
                            q.includes("group_parents_group_shared_tenant"),
                    )

                    expect(insertQueries).to.have.length(1)

                    const insertQuery = insertQueries[0]

                    // Parse INSERT column names using regex
                    const insertRegex =
                        /INSERT INTO "group_parents_group_shared_tenant"\("(\w+)", "(\w+)", "(\w+)"\)/

                    const match = insertQuery.match(insertRegex)
                    expect(match, "insert column match").to.not.be.null
                    const columns = [match![1], match![2], match![3]]

                    // Validate we have exactly the expected columns
                    expect(columns).to.have.length(3)
                    expect(columns).to.include("tenant_id")
                    expect(columns).to.include("parent_id")
                    expect(columns).to.include("child_id")
                }),
            ))

        it("should work functionally with shared columns", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parent = createEntity(ExplicitGroup)
                    const child1 = createEntity(ExplicitGroup)
                    const child2 = createEntity(ExplicitGroup)

                    await dataSource.manager.save([parent, child1, child2])

                    // Test adding relationships
                    parent.children = [child1, child2]
                    await dataSource.manager.save(parent)

                    let savedParent = await dataSource.manager.findOne(
                        ExplicitGroup,
                        {
                            where: {
                                id: parent.id,
                                tenantId: parent.tenantId,
                            },
                            relations: ["children"],
                        },
                    )

                    expect(savedParent?.children).to.have.length(2)

                    // Test updating relationships
                    parent.children = [child1]
                    await dataSource.manager.save(parent)

                    savedParent = await dataSource.manager.findOne(
                        ExplicitGroup,
                        {
                            where: {
                                id: parent.id,
                                tenantId: parent.tenantId,
                            },
                            relations: ["children"],
                        },
                    )

                    expect(savedParent?.children).to.have.length(1)
                    expect(savedParent?.children[0].id).to.equal(child1.id)
                }),
            ))
    })
})
