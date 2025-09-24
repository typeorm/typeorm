/* eslint-disable @typescript-eslint/no-unused-expressions */
import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { UserRenamed } from "./entity/UserRenamed"
import { GroupRenamed } from "./entity/GroupRenamed"
import { UserPreserved } from "./entity/UserPreserved"
import { GroupPreserved } from "./entity/GroupPreserved"
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

// Example usage in tests:
// const user = createUser()
// const group = createGroup()
// const user2 = createUser("tenant2") // different tenant

/**
 * Support shared columns in junction tables for composite foreign keys
 * @see https://github.com/typeorm/typeorm/issues/11682
 */
describe("github issues > #11682", () => {
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

    describe("Current behavior validation (regression tests)", () => {
        it("should have renamed columns in junction table schema", () =>
            dataSources.forEach((dataSource) => {
                const userMetadata = dataSource.getMetadata(UserRenamed)
                const groupsRelation =
                    userMetadata.findRelationWithPropertyPath("groups")!
                const junctionMetadata = groupsRelation.junctionEntityMetadata!

                const columnNames = junctionMetadata.columns.map(
                    (col) => col.databaseName,
                )

                // Should have 4 columns
                expect(columnNames).to.have.length(4)

                // Should contain user_id, group_id and tenant_id renamed
                expect(columnNames).to.include("user_id")
                expect(columnNames).to.include("group_id")
                expect(columnNames).to.include("tenant_id_1")
                expect(columnNames).to.include("tenant_id_2")
            }))

        describe("from owner side", () => {
            it("should generate INSERT with renamed columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user = createEntity(UserRenamed)
                        await dataSource.manager.save(user)

                        const group = createEntity(GroupRenamed)
                        await dataSource.manager.save(group)

                        // Clear setup queries and test junction INSERT
                        logger.clear()

                        user.groups = [group]
                        await dataSource.manager.save(user)

                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups"),
                        )

                        expect(insertQueries).to.have.length(1)

                        const insertQuery = insertQueries[0]

                        // Parse INSERT column names using regex
                        const insertRegex =
                            /INSERT INTO "user_groups"\("(\w+)", "(\w+)", "(\w+)", "(\w+)"\)/

                        const match = insertQuery.match(insertRegex)
                        expect(match, "insert column match").to.not.be.null
                        const columns = [
                            match![1],
                            match![2],
                            match![3],
                            match![4],
                        ]

                        // Validate we have exactly the expected columns
                        expect(columns).to.have.length(4)
                        expect(columns).to.include("user_id")
                        expect(columns).to.include("group_id")
                        expect(columns).to.include("tenant_id_1")
                        expect(columns).to.include("tenant_id_2")
                    }),
                ))

            it("should generate DELETE with renamed columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data with existing relationship
                        const user = createEntity(UserRenamed)
                        const group = createEntity(GroupRenamed)
                        await dataSource.manager.save([user, group])

                        user.groups = [group]
                        await dataSource.manager.save(user)

                        // Clear setup queries and test junction DELETE
                        logger.clear()

                        user.groups = []
                        await dataSource.manager.save(user)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups"),
                        )

                        expect(deleteQueries).to.have.length(1)

                        const deleteQuery = deleteQueries[0]

                        // Parse DELETE WHERE clause using regex
                        const deleteRegex =
                            /WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/s

                        const match = deleteQuery.match(deleteRegex)
                        expect(match, "delete column match").to.not.be.null
                        const whereColumns = [
                            match![1],
                            match![2],
                            match![3],
                            match![4],
                        ]

                        // Validate WHERE clause uses renamed columns
                        expect(whereColumns).to.have.length(4)
                        expect(whereColumns).to.include("user_id")
                        expect(whereColumns).to.include("group_id")
                        expect(whereColumns).to.include("tenant_id_1")
                        expect(whereColumns).to.include("tenant_id_2")
                    }),
                ))

            it("should generate UPDATE operations (DELETE + INSERT)", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user = createEntity(UserRenamed)
                        const group1 = createEntity(GroupRenamed)
                        const group2 = createEntity(GroupRenamed)
                        await dataSource.manager.save([user, group1, group2])

                        // Establish initial relationship
                        user.groups = [group1]
                        await dataSource.manager.save(user)

                        // Clear setup queries and test relationship update
                        logger.clear()

                        user.groups = [group2] // Change from group1 to group2
                        await dataSource.manager.save(user)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups"),
                        )
                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups"),
                        )

                        // Should perform DELETE (remove old) + INSERT (add new)
                        expect(deleteQueries).to.have.length(1)
                        expect(insertQueries).to.have.length(1)

                        // Parse DELETE query
                        const deleteQuery = deleteQueries[0]
                        const deleteRegex =
                            /DELETE FROM "user_groups" WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/

                        const deleteMatch = deleteQuery.match(deleteRegex)
                        expect(deleteMatch, "delete column match").to.not.be
                            .null
                        const deleteColumns = [
                            deleteMatch![1],
                            deleteMatch![2],
                            deleteMatch![3],
                            deleteMatch![4],
                        ]

                        expect(deleteColumns).to.include("user_id")
                        expect(deleteColumns).to.include("group_id")
                        expect(deleteColumns).to.include("tenant_id_1")
                        expect(deleteColumns).to.include("tenant_id_2")

                        // Parse INSERT query
                        const insertQuery = insertQueries[0]
                        const insertRegex =
                            /INSERT INTO "user_groups"\("(\w+)", "(\w+)", "(\w+)", "(\w+)"\)/

                        const insertMatch = insertQuery.match(insertRegex)
                        expect(insertMatch, "insert column match").to.not.be
                            .null
                        const insertColumns = [
                            insertMatch![1],
                            insertMatch![2],
                            insertMatch![3],
                            insertMatch![4],
                        ]

                        expect(insertColumns).to.include("user_id")
                        expect(insertColumns).to.include("group_id")
                        expect(insertColumns).to.include("tenant_id_1")
                        expect(insertColumns).to.include("tenant_id_2")
                    }),
                ))

            it("should work functionally with column renaming", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const user = createEntity(UserRenamed)
                        const group1 = createEntity(GroupRenamed)
                        const group2 = createEntity(GroupRenamed)

                        await dataSource.manager.save([user, group1, group2])

                        // Test adding relationships
                        user.groups = [group1, group2]
                        await dataSource.manager.save(user)

                        let savedUser = await dataSource.manager.findOne(
                            UserRenamed,
                            {
                                where: { id: user.id, tenantId: user.tenantId },
                                relations: ["groups"],
                            },
                        )

                        expect(savedUser?.groups).to.have.length(2)

                        // Test updating relationships
                        user.groups = [group1]
                        await dataSource.manager.save(user)

                        savedUser = await dataSource.manager.findOne(
                            UserRenamed,
                            {
                                where: { id: user.id, tenantId: user.tenantId },
                                relations: ["groups"],
                            },
                        )

                        expect(savedUser?.groups).to.have.length(1)
                        expect(savedUser?.groups[0].id).to.equal(group1.id)
                    }),
                ))
        })

        describe("from inverse side", () => {
            it("should generate INSERT with renamed columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user = createEntity(UserRenamed)
                        await dataSource.manager.save(user)

                        const group = createEntity(GroupRenamed)
                        await dataSource.manager.save(group)

                        // Clear setup queries and test junction INSERT
                        logger.clear()

                        group.users = [user]
                        await dataSource.manager.save(group)

                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups"),
                        )

                        expect(insertQueries).to.have.length(1)

                        const insertQuery = insertQueries[0]

                        // Parse INSERT column names using regex
                        const insertRegex =
                            /INSERT INTO "user_groups"\("(\w+)", "(\w+)", "(\w+)", "(\w+)"\)/

                        const match = insertQuery.match(insertRegex)
                        expect(match, "insert column match").to.not.be.null
                        const columns = [
                            match![1],
                            match![2],
                            match![3],
                            match![4],
                        ]

                        // Validate we have exactly the expected columns
                        expect(columns).to.have.length(4)
                        expect(columns).to.include("user_id")
                        expect(columns).to.include("group_id")
                        expect(columns).to.include("tenant_id_1")
                        expect(columns).to.include("tenant_id_2")
                    }),
                ))

            it("should generate DELETE with renamed columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data with existing relationship
                        const user = createEntity(UserRenamed)
                        const group = createEntity(GroupRenamed)
                        await dataSource.manager.save([user, group])

                        group.users = [user]
                        await dataSource.manager.save(group)

                        // Clear setup queries and test junction DELETE
                        logger.clear()

                        group.users = []
                        await dataSource.manager.save(group)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups"),
                        )

                        expect(deleteQueries).to.have.length(1)

                        const deleteQuery = deleteQueries[0]

                        // Parse DELETE WHERE clause using regex
                        const deleteRegex =
                            /WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/s

                        const match = deleteQuery.match(deleteRegex)
                        expect(match, "delete column match").to.not.be.null
                        const whereColumns = [
                            match![1],
                            match![2],
                            match![3],
                            match![4],
                        ]

                        // Validate WHERE clause uses renamed columns
                        expect(whereColumns).to.have.length(4)
                        expect(whereColumns).to.include("user_id")
                        expect(whereColumns).to.include("group_id")
                        expect(whereColumns).to.include("tenant_id_1")
                        expect(whereColumns).to.include("tenant_id_2")
                    }),
                ))

            it("should generate UPDATE operations (DELETE + INSERT)", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user1 = createEntity(UserRenamed)
                        const user2 = createEntity(UserRenamed)
                        const group = createEntity(GroupRenamed)
                        await dataSource.manager.save([user1, user2, group])

                        // Establish initial relationship
                        group.users = [user1]
                        await dataSource.manager.save(group)

                        // Clear setup queries and test relationship update
                        logger.clear()

                        group.users = [user2] // Change from user1 to user2
                        await dataSource.manager.save(group)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups"),
                        )
                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups"),
                        )

                        // Should perform DELETE (remove old) + INSERT (add new)
                        expect(deleteQueries).to.have.length(1)
                        expect(insertQueries).to.have.length(1)

                        // Parse DELETE query
                        const deleteQuery = deleteQueries[0]
                        const deleteRegex =
                            /DELETE FROM "user_groups" WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/

                        const deleteMatch = deleteQuery.match(deleteRegex)
                        expect(deleteMatch, "delete column match").to.not.be
                            .null
                        const deleteColumns = [
                            deleteMatch![1],
                            deleteMatch![2],
                            deleteMatch![3],
                            deleteMatch![4],
                        ]

                        expect(deleteColumns).to.include("user_id")
                        expect(deleteColumns).to.include("group_id")
                        expect(deleteColumns).to.include("tenant_id_1")
                        expect(deleteColumns).to.include("tenant_id_2")

                        // Parse INSERT query
                        const insertQuery = insertQueries[0]
                        const insertRegex =
                            /INSERT INTO "user_groups"\("(\w+)", "(\w+)", "(\w+)", "(\w+)"\)/

                        const insertMatch = insertQuery.match(insertRegex)
                        expect(insertMatch, "insert column match").to.not.be
                            .null
                        const insertColumns = [
                            insertMatch![1],
                            insertMatch![2],
                            insertMatch![3],
                            insertMatch![4],
                        ]

                        expect(insertColumns).to.include("user_id")
                        expect(insertColumns).to.include("group_id")
                        expect(insertColumns).to.include("tenant_id_1")
                        expect(insertColumns).to.include("tenant_id_2")
                    }),
                ))

            it("should work functionally with column renaming", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const user1 = createEntity(UserRenamed)
                        const user2 = createEntity(UserRenamed)
                        const group = createEntity(GroupRenamed)
                        await dataSource.manager.save([user1, user2, group])

                        // Test adding relationships
                        group.users = [user1, user2]
                        await dataSource.manager.save(group)

                        let savedGroup = await dataSource.manager.findOne(
                            GroupRenamed,
                            {
                                where: {
                                    id: group.id,
                                    tenantId: group.tenantId,
                                },
                                relations: ["users"],
                            },
                        )

                        expect(savedGroup?.users).to.have.length(2)

                        // Test updating relationships
                        group.users = [user1]
                        await dataSource.manager.save(group)

                        savedGroup = await dataSource.manager.findOne(
                            GroupRenamed,
                            {
                                where: {
                                    id: group.id,
                                    tenantId: group.tenantId,
                                },
                                relations: ["users"],
                            },
                        )

                        expect(savedGroup?.users).to.have.length(1)
                        expect(savedGroup?.users[0].id).to.equal(user1.id)
                    }),
                ))
        })

        it("should maintain bidirectional consistency", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = createEntity(UserRenamed)
                    const group1 = createEntity(GroupRenamed)
                    const group2 = createEntity(GroupRenamed)
                    await dataSource.manager.save([user, group1, group2])

                    // Set relationship from owner side
                    user.groups = [group1]
                    await dataSource.manager.save(user)

                    // Verify from inverse side
                    let savedGroup1 = await dataSource.manager.findOneOrFail(
                        GroupRenamed,
                        {
                            where: { id: group1.id, tenantId: group1.tenantId },
                            relations: ["users"],
                        },
                    )
                    expect(savedGroup1.users).to.have.length(1)
                    expect(savedGroup1.users[0].id).to.equal(user.id)

                    // Change relationship from inverse side (add user to group2)
                    group2.users = [user]
                    await dataSource.manager.save(group2)

                    // Verify consistency from owner side
                    const savedUser = await dataSource.manager.findOneOrFail(
                        UserRenamed,
                        {
                            where: { id: user.id, tenantId: user.tenantId },
                            relations: ["groups"],
                        },
                    )
                    expect(savedUser.groups).to.have.length(2)
                    const groupIds = savedUser.groups.map((g) => g.id)
                    expect(groupIds).to.include(group1.id)
                    expect(groupIds).to.include(group2.id)

                    // Verify group1 still has the user (relationship is additive)
                    savedGroup1 = await dataSource.manager.findOneOrFail(
                        GroupRenamed,
                        {
                            where: { id: group1.id, tenantId: group1.tenantId },
                            relations: ["users"],
                        },
                    )
                    expect(savedGroup1.users).to.have.length(1)
                    expect(savedGroup1.users[0].id).to.equal(user.id)

                    // Verify group2 also has the user
                    const savedGroup2 = await dataSource.manager.findOneOrFail(
                        GroupRenamed,
                        {
                            where: { id: group2.id, tenantId: group2.tenantId },
                            relations: ["users"],
                        },
                    )
                    expect(savedGroup2.users).to.have.length(1)
                    expect(savedGroup2.users[0].id).to.equal(user.id)
                }),
            ))
    })

    describe("Expected behavior with preserveSharedColumns", () => {
        beforeEach(() =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // Manually create the junction table as TypeORM doesn't support shared columns in DDL
                    const queryRunner = dataSource.createQueryRunner()
                    await queryRunner.query(`CREATE TABLE "user_groups_shared" (
                        "tenant_id" VARCHAR(255) NOT NULL,
                        "user_id" VARCHAR(255) NOT NULL,
                        "group_id" VARCHAR(255) NOT NULL,
                        PRIMARY KEY ("tenant_id", "user_id", "group_id")
                    )`)
                    await queryRunner.release()
                }),
            ),
        )

        it("should have preserved shared columns in junction table schema", () =>
            dataSources.forEach((dataSource) => {
                const userMetadata = dataSource.getMetadata(UserPreserved)
                const groupsRelation =
                    userMetadata.findRelationWithPropertyPath("groups")!
                const junctionMetadata = groupsRelation.junctionEntityMetadata!

                const columnNames = junctionMetadata.columns.map(
                    (col) => col.databaseName,
                )

                // Should still have 4 columns
                expect(columnNames).to.have.length(4)

                // Should contain user_id, group_id and tenant_id
                expect(columnNames).to.include("user_id")
                expect(columnNames).to.include("group_id")
                expect(columnNames).to.include("tenant_id") // Found twice
            }))

        describe("from owner side", () => {
            it("should generate INSERT with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user = createEntity(UserPreserved)
                        await dataSource.manager.save(user)

                        const group = createEntity(GroupPreserved)
                        await dataSource.manager.save(group)

                        // Clear setup queries and test junction INSERT
                        logger.clear()

                        user.groups = [group]
                        await dataSource.manager.save(user)

                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups_shared"),
                        )

                        expect(insertQueries).to.have.length(1)

                        const insertQuery = insertQueries[0]

                        // Parse INSERT column names using regex
                        const insertRegex =
                            /INSERT INTO "user_groups_shared"\("(\w+)", "(\w+)", "(\w+)"\)/

                        const match = insertQuery.match(insertRegex)
                        expect(match, "insert column match").to.not.be.null
                        const columns = [match![1], match![2], match![3]]

                        // Validate we have exactly the expected columns
                        expect(columns).to.have.length(3)
                        expect(columns).to.include("user_id")
                        expect(columns).to.include("group_id")
                        expect(columns).to.include("tenant_id")
                    }),
                ))

            it("should generate DELETE with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data with existing relationship
                        const user = createEntity(UserPreserved)
                        const group = createEntity(GroupPreserved)
                        await dataSource.manager.save([user, group])

                        user.groups = [group]
                        await dataSource.manager.save(user)

                        // Clear setup queries and test junction DELETE
                        logger.clear()

                        user.groups = []
                        await dataSource.manager.save(user)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups_shared"),
                        )

                        expect(deleteQueries).to.have.length(1)

                        const deleteQuery = deleteQueries[0]

                        // Parse DELETE WHERE clause using regex
                        const deleteRegex =
                            /WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/s

                        const match = deleteQuery.match(deleteRegex)
                        expect(match, "delete column match").to.not.be.null
                        const whereColumns = [match![1], match![2], match![3]]

                        // Validate WHERE clause uses preserved shared columns
                        expect(whereColumns).to.have.length(3)
                        expect(whereColumns).to.include("user_id")
                        expect(whereColumns).to.include("group_id")
                        expect(whereColumns).to.include("tenant_id")
                    }),
                ))

            it("should generate UPDATE operations (DELETE + INSERT) with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user = createEntity(UserPreserved)
                        const group1 = createEntity(GroupPreserved)
                        const group2 = createEntity(GroupPreserved)
                        await dataSource.manager.save([user, group1, group2])

                        // Establish initial relationship
                        user.groups = [group1]
                        await dataSource.manager.save(user)

                        // Clear setup queries and test relationship update
                        logger.clear()

                        user.groups = [group2] // Change from group1 to group2
                        await dataSource.manager.save(user)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups_shared"),
                        )
                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups_shared"),
                        )

                        // Should perform DELETE (remove old) + INSERT (add new)
                        expect(deleteQueries).to.have.length(1)
                        expect(insertQueries).to.have.length(1)

                        // Parse DELETE query
                        const deleteQuery = deleteQueries[0]
                        const deleteRegex =
                            /DELETE FROM "user_groups_shared" WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/

                        const deleteMatch = deleteQuery.match(deleteRegex)
                        expect(deleteMatch, "delete column match").to.not.be
                            .null
                        const deleteColumns = [
                            deleteMatch![1],
                            deleteMatch![2],
                            deleteMatch![3],
                        ]

                        expect(deleteColumns).to.include("user_id")
                        expect(deleteColumns).to.include("group_id")
                        expect(deleteColumns).to.include("tenant_id")

                        // Parse INSERT query
                        const insertQuery = insertQueries[0]
                        const insertRegex =
                            /INSERT INTO "user_groups_shared"\("(\w+)", "(\w+)", "(\w+)"\)/

                        const insertMatch = insertQuery.match(insertRegex)
                        expect(insertMatch, "insert column match").to.not.be
                            .null
                        const insertColumns = [
                            insertMatch![1],
                            insertMatch![2],
                            insertMatch![3],
                        ]

                        expect(insertColumns).to.include("user_id")
                        expect(insertColumns).to.include("group_id")
                        expect(insertColumns).to.include("tenant_id")
                    }),
                ))

            it("should work functionally with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const user = createEntity(UserPreserved)
                        const group1 = createEntity(GroupPreserved)
                        const group2 = createEntity(GroupPreserved)

                        await dataSource.manager.save([user, group1, group2])

                        // Test adding relationships
                        user.groups = [group1, group2]
                        await dataSource.manager.save(user)

                        let savedUser = await dataSource.manager.findOne(
                            UserPreserved,
                            {
                                where: { id: user.id, tenantId: user.tenantId },
                                relations: ["groups"],
                            },
                        )

                        expect(savedUser?.groups).to.have.length(2)

                        // Test updating relationships
                        user.groups = [group1]
                        await dataSource.manager.save(user)

                        savedUser = await dataSource.manager.findOne(
                            UserPreserved,
                            {
                                where: { id: user.id, tenantId: user.tenantId },
                                relations: ["groups"],
                            },
                        )

                        expect(savedUser?.groups).to.have.length(1)
                        expect(savedUser?.groups[0].id).to.equal(group1.id)
                    }),
                ))
        })

        describe("from inverse side", () => {
            it("should generate INSERT with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user = createEntity(UserPreserved)
                        await dataSource.manager.save(user)

                        const group = createEntity(GroupPreserved)
                        await dataSource.manager.save(group)

                        // Clear setup queries and test junction INSERT
                        logger.clear()

                        group.users = [user]
                        await dataSource.manager.save(group)

                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups_shared"),
                        )

                        expect(insertQueries).to.have.length(1)

                        const insertQuery = insertQueries[0]

                        // Parse INSERT column names using regex
                        const insertRegex =
                            /INSERT INTO "user_groups_shared"\("(\w+)", "(\w+)", "(\w+)"\)/

                        const match = insertQuery.match(insertRegex)
                        expect(match, "insert column match").to.not.be.null
                        const columns = [match![1], match![2], match![3]]

                        // Validate we have exactly the expected columns
                        expect(columns).to.have.length(3)
                        expect(columns).to.include("user_id")
                        expect(columns).to.include("group_id")
                        expect(columns).to.include("tenant_id")
                    }),
                ))

            it("should generate DELETE with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data with existing relationship
                        const user = createEntity(UserPreserved)
                        const group = createEntity(GroupPreserved)
                        await dataSource.manager.save([user, group])

                        group.users = [user]
                        await dataSource.manager.save(group)

                        // Clear setup queries and test junction DELETE
                        logger.clear()

                        group.users = []
                        await dataSource.manager.save(group)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups_shared"),
                        )

                        expect(deleteQueries).to.have.length(1)

                        const deleteQuery = deleteQueries[0]

                        // Parse DELETE WHERE clause using regex
                        const deleteRegex =
                            /WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/s

                        const match = deleteQuery.match(deleteRegex)
                        expect(match, "delete column match").to.not.be.null
                        const whereColumns = [match![1], match![2], match![3]]

                        // Validate WHERE clause uses preserved shared columns
                        expect(whereColumns).to.have.length(3)
                        expect(whereColumns).to.include("user_id")
                        expect(whereColumns).to.include("group_id")
                        expect(whereColumns).to.include("tenant_id")
                    }),
                ))

            it("should generate UPDATE operations (DELETE + INSERT) with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const logger = dataSource.logger as MemoryLogger

                        // Setup test data
                        const user1 = createEntity(UserPreserved)
                        const user2 = createEntity(UserPreserved)
                        const group = createEntity(GroupPreserved)
                        await dataSource.manager.save([user1, user2, group])

                        // Establish initial relationship
                        group.users = [user1]
                        await dataSource.manager.save(group)

                        // Clear setup queries and test relationship update
                        logger.clear()

                        group.users = [user2] // Change from user1 to user2
                        await dataSource.manager.save(group)

                        const deleteQueries = logger.queries.filter(
                            (q) =>
                                q.includes("DELETE") &&
                                q.includes("user_groups_shared"),
                        )
                        const insertQueries = logger.queries.filter(
                            (q) =>
                                q.includes("INSERT") &&
                                q.includes("user_groups_shared"),
                        )

                        // Should perform DELETE (remove old) + INSERT (add new)
                        expect(deleteQueries).to.have.length(1)
                        expect(insertQueries).to.have.length(1)

                        // Parse DELETE query
                        const deleteQuery = deleteQueries[0]
                        const deleteRegex =
                            /DELETE FROM "user_groups_shared" WHERE \("(\w+)" = .+ AND "(\w+)" = .+ AND "(\w+)" = .+\)/

                        const deleteMatch = deleteQuery.match(deleteRegex)
                        expect(deleteMatch, "delete column match").to.not.be
                            .null
                        const deleteColumns = [
                            deleteMatch![1],
                            deleteMatch![2],
                            deleteMatch![3],
                        ]

                        expect(deleteColumns).to.include("user_id")
                        expect(deleteColumns).to.include("group_id")
                        expect(deleteColumns).to.include("tenant_id")

                        // Parse INSERT query
                        const insertQuery = insertQueries[0]
                        const insertRegex =
                            /INSERT INTO "user_groups_shared"\("(\w+)", "(\w+)", "(\w+)"\)/

                        const insertMatch = insertQuery.match(insertRegex)
                        expect(insertMatch, "insert column match").to.not.be
                            .null
                        const insertColumns = [
                            insertMatch![1],
                            insertMatch![2],
                            insertMatch![3],
                        ]

                        expect(insertColumns).to.include("user_id")
                        expect(insertColumns).to.include("group_id")
                        expect(insertColumns).to.include("tenant_id")
                    }),
                ))

            it("should work functionally with preserved shared columns", () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const user1 = createEntity(UserPreserved)
                        const user2 = createEntity(UserPreserved)
                        const group = createEntity(GroupPreserved)
                        await dataSource.manager.save([user1, user2, group])

                        // Test adding relationships
                        group.users = [user1, user2]
                        await dataSource.manager.save(group)

                        let savedGroup = await dataSource.manager.findOne(
                            GroupPreserved,
                            {
                                where: {
                                    id: group.id,
                                    tenantId: group.tenantId,
                                },
                                relations: ["users"],
                            },
                        )

                        expect(savedGroup?.users).to.have.length(2)

                        // Test updating relationships
                        group.users = [user1]
                        await dataSource.manager.save(group)

                        savedGroup = await dataSource.manager.findOne(
                            GroupPreserved,
                            {
                                where: {
                                    id: group.id,
                                    tenantId: group.tenantId,
                                },
                                relations: ["users"],
                            },
                        )

                        expect(savedGroup?.users).to.have.length(1)
                        expect(savedGroup?.users[0].id).to.equal(user1.id)
                    }),
                ))
        })

        it("should maintain bidirectional consistency", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = createEntity(UserPreserved)
                    const group1 = createEntity(GroupPreserved)
                    const group2 = createEntity(GroupPreserved)
                    await dataSource.manager.save([user, group1, group2])

                    // Set relationship from owner side
                    user.groups = [group1]
                    await dataSource.manager.save(user)

                    // Verify from inverse side
                    let savedGroup1 = await dataSource.manager.findOneOrFail(
                        GroupPreserved,
                        {
                            where: { id: group1.id, tenantId: group1.tenantId },
                            relations: ["users"],
                        },
                    )
                    expect(savedGroup1.users).to.have.length(1)
                    expect(savedGroup1.users[0].id).to.equal(user.id)

                    // Change relationship from inverse side (add user to group2)
                    group2.users = [user]
                    await dataSource.manager.save(group2)

                    // Verify consistency from owner side
                    const savedUser = await dataSource.manager.findOneOrFail(
                        UserPreserved,
                        {
                            where: { id: user.id, tenantId: user.tenantId },
                            relations: ["groups"],
                        },
                    )
                    expect(savedUser.groups).to.have.length(2)
                    const groupIds = savedUser.groups.map((g) => g.id)
                    expect(groupIds).to.include(group1.id)
                    expect(groupIds).to.include(group2.id)

                    // Verify group1 still has the user (relationship is additive)
                    savedGroup1 = await dataSource.manager.findOneOrFail(
                        GroupPreserved,
                        {
                            where: { id: group1.id, tenantId: group1.tenantId },
                            relations: ["users"],
                        },
                    )
                    expect(savedGroup1.users).to.have.length(1)
                    expect(savedGroup1.users[0].id).to.equal(user.id)

                    // Verify group2 also has the user
                    const savedGroup2 = await dataSource.manager.findOneOrFail(
                        GroupPreserved,
                        {
                            where: { id: group2.id, tenantId: group2.tenantId },
                            relations: ["users"],
                        },
                    )
                    expect(savedGroup2.users).to.have.length(1)
                    expect(savedGroup2.users[0].id).to.equal(user.id)
                }),
            ))
    })
})
