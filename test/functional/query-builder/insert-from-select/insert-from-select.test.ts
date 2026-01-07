import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { ArchivedUser } from "./entity/ArchivedUser"
import { Post } from "./entity/Post"
import { UserPostSummary } from "./entity/UserPostSummary"

describe("query builder > insert from select", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert from select using a SelectQueryBuilder directly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test users using repository save (Oracle-compatible)
                // Oracle does not support bulk inserts via QueryBuilder
                const userRepo = dataSource.getRepository(User)
                await userRepo.save([
                    {
                        name: "John",
                        email: "john@example.com",
                        isArchived: true,
                    },
                    {
                        name: "Jane",
                        email: "jane@example.com",
                        isArchived: false,
                    },
                    {
                        name: "Bob",
                        email: "bob@example.com",
                        isArchived: true,
                    },
                ])

                // Create SELECT query builder for archived users
                const selectQb = dataSource
                    .createQueryBuilder()
                    .select(["user.name", "user.email"])
                    .from(User, "user")
                    .where("user.isArchived = :archived", { archived: true })

                // Insert from select
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect(selectQb)
                    .execute()

                // Verify the results
                const archivedUsers = await dataSource
                    .getRepository(ArchivedUser)
                    .find({
                        order: { name: "ASC" },
                    })

                expect(archivedUsers).to.have.length(2)
                expect(archivedUsers[0].name).to.equal("Bob")
                expect(archivedUsers[0].email).to.equal("bob@example.com")
                expect(archivedUsers[1].name).to.equal("John")
                expect(archivedUsers[1].email).to.equal("john@example.com")
            }),
        ))

    it("should insert from select using a callback function", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test users using repository save (Oracle-compatible)
                const userRepo = dataSource.getRepository(User)
                await userRepo.save([
                    {
                        name: "Alice",
                        email: "alice@example.com",
                        isArchived: true,
                    },
                    {
                        name: "Charlie",
                        email: "charlie@example.com",
                        isArchived: true,
                    },
                ])

                // Insert from select using callback
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect((qb) =>
                        qb
                            .select(["user.name", "user.email"])
                            .from(User, "user")
                            .where("user.isArchived = :archived", {
                                archived: true,
                            }),
                    )
                    .execute()

                // Verify the results
                const archivedUsers = await dataSource
                    .getRepository(ArchivedUser)
                    .find({
                        order: { name: "ASC" },
                    })

                expect(archivedUsers).to.have.length(2)
                expect(archivedUsers[0].name).to.equal("Alice")
                expect(archivedUsers[1].name).to.equal("Charlie")
            }),
        ))

    it("should insert all rows when no WHERE clause is specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test users using repository save (Oracle-compatible)
                const userRepo = dataSource.getRepository(User)
                await userRepo.save([
                    {
                        name: "User1",
                        email: "user1@example.com",
                        isArchived: false,
                    },
                    {
                        name: "User2",
                        email: "user2@example.com",
                        isArchived: false,
                    },
                ])

                // Insert all users from select (no WHERE)
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect((qb) =>
                        qb
                            .select(["user.name", "user.email"])
                            .from(User, "user"),
                    )
                    .execute()

                // Verify all users were copied
                const archivedUsers = await dataSource
                    .getRepository(ArchivedUser)
                    .find()

                expect(archivedUsers).to.have.length(2)
            }),
        ))

    it("should correctly generate SQL query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const selectQb = dataSource
                    .createQueryBuilder()
                    .select(["user.name", "user.email"])
                    .from(User, "user")
                    .where("user.isArchived = :archived", { archived: true })

                const insertQb = dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect(selectQb)

                const query = insertQb.getQuery()

                // Verify the query contains INSERT INTO and SELECT
                expect(query).to.include("INSERT INTO")
                expect(query).to.include("SELECT")
                expect(query).to.include("FROM")
            }),
        ))

    it("should handle parameters correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test user using repository save (Oracle-compatible)
                const userRepo = dataSource.getRepository(User)
                await userRepo.save({
                    name: "TestUser",
                    email: "test@example.com",
                    isArchived: true,
                })

                // Use parameters in WHERE clause
                const emailPattern = "test@%"
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect((qb) =>
                        qb
                            .select(["user.name", "user.email"])
                            .from(User, "user")
                            .where("user.email LIKE :pattern", {
                                pattern: emailPattern,
                            }),
                    )
                    .execute()

                const archivedUsers = await dataSource
                    .getRepository(ArchivedUser)
                    .find()

                expect(archivedUsers).to.have.length(1)
                expect(archivedUsers[0].name).to.equal("TestUser")
            }),
        ))

    it("should work with ORDER BY and LIMIT in select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test users using repository save (Oracle-compatible)
                const userRepo = dataSource.getRepository(User)
                await userRepo.save([
                    {
                        name: "Zara",
                        email: "zara@example.com",
                        isArchived: true,
                    },
                    {
                        name: "Adam",
                        email: "adam@example.com",
                        isArchived: true,
                    },
                    {
                        name: "Mike",
                        email: "mike@example.com",
                        isArchived: true,
                    },
                ])

                // Insert only the first 2 users ordered by name
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect((qb) =>
                        qb
                            .select(["user.name", "user.email"])
                            .from(User, "user")
                            .where("user.isArchived = :archived", {
                                archived: true,
                            })
                            .orderBy("user.name", "ASC")
                            .limit(2),
                    )
                    .execute()

                const archivedUsers = await dataSource
                    .getRepository(ArchivedUser)
                    .find({
                        order: { name: "ASC" },
                    })

                expect(archivedUsers).to.have.length(2)
                expect(archivedUsers[0].name).to.equal("Adam")
                expect(archivedUsers[1].name).to.equal("Mike")
            }),
        ))

    it("should insert from select with JOIN and GROUP BY", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test users
                const userRepo = dataSource.getRepository(User)
                const users = await userRepo.save([
                    {
                        name: "Author1",
                        email: "author1@example.com",
                        isArchived: false,
                    },
                    {
                        name: "Author2",
                        email: "author2@example.com",
                        isArchived: false,
                    },
                    {
                        name: "Author3",
                        email: "author3@example.com",
                        isArchived: false,
                    },
                ])

                // Insert test posts
                const postRepo = dataSource.getRepository(Post)
                await postRepo.save([
                    { title: "Post 1", authorId: users[0].id },
                    { title: "Post 2", authorId: users[0].id },
                    { title: "Post 3", authorId: users[0].id },
                    { title: "Post 4", authorId: users[1].id },
                    { title: "Post 5", authorId: users[1].id },
                    // Author3 has no posts
                ])

                // Insert from select with LEFT JOIN and GROUP BY
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(UserPostSummary, ["userName", "postCount"])
                    .valuesFromSelect((qb) =>
                        qb
                            .select(["user.name", "COUNT(post.id)"])
                            .from(User, "user")
                            .leftJoin(Post, "post", "post.authorId = user.id")
                            .groupBy("user.id")
                            .addGroupBy("user.name"),
                    )
                    .execute()

                // Verify the results
                const summaries = await dataSource
                    .getRepository(UserPostSummary)
                    .find({
                        order: { userName: "ASC" },
                    })

                expect(summaries).to.have.length(3)

                // Author1 has 3 posts
                expect(summaries[0].userName).to.equal("Author1")
                expect(summaries[0].postCount).to.equal(3)

                // Author2 has 2 posts
                expect(summaries[1].userName).to.equal("Author2")
                expect(summaries[1].postCount).to.equal(2)

                // Author3 has 0 posts
                expect(summaries[2].userName).to.equal("Author3")
                expect(summaries[2].postCount).to.equal(0)
            }),
        ))

    it("should insert from select with INNER JOIN", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Insert test users
                const userRepo = dataSource.getRepository(User)
                const users = await userRepo.save([
                    {
                        name: "Writer1",
                        email: "writer1@example.com",
                        isArchived: true,
                    },
                    {
                        name: "Writer2",
                        email: "writer2@example.com",
                        isArchived: true,
                    },
                    {
                        name: "Writer3",
                        email: "writer3@example.com",
                        isArchived: true,
                    },
                ])

                // Insert test posts - only Writer1 and Writer2 have posts
                const postRepo = dataSource.getRepository(Post)
                await postRepo.save([
                    { title: "Article 1", authorId: users[0].id },
                    { title: "Article 2", authorId: users[1].id },
                    // Writer3 has no posts
                ])

                // Insert from select with INNER JOIN - only users with posts
                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(ArchivedUser, ["name", "email"])
                    .valuesFromSelect((qb) =>
                        qb
                            .select(["user.name", "user.email"])
                            .from(User, "user")
                            .innerJoin(Post, "post", "post.authorId = user.id")
                            .where("user.isArchived = :archived", {
                                archived: true,
                            }),
                    )
                    .execute()

                // Verify - only users with posts should be inserted
                const archivedUsers = await dataSource
                    .getRepository(ArchivedUser)
                    .find({
                        order: { name: "ASC" },
                    })

                expect(archivedUsers).to.have.length(2)
                expect(archivedUsers[0].name).to.equal("Writer1")
                expect(archivedUsers[1].name).to.equal("Writer2")
                // Writer3 should NOT be included because they have no posts
            }),
        ))

    it("should not be able to use both values and valuesFromSelect together", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Attempt to use first valuesFromSelect then values
                expect(() => {
                    dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(User)
                        .valuesFromSelect(
                            dataSource
                                .createQueryBuilder()
                                .select("user.name", "name")
                                .from(User, "user"),
                        )
                        .values({ name: "test" })
                }).to.throw(
                    'Cannot use both "values" and "valuesFromSelect" methods together',
                )

                // Attempt to use first values then valuesFromSelect
                expect(() => {
                    dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(User)
                        .values({ name: "test" })
                        .valuesFromSelect(
                            dataSource
                                .createQueryBuilder()
                                .select("user.name", "name")
                                .from(User, "user"),
                        )
                }).to.throw(
                    'Cannot use both "values" and "valuesFromSelect" methods together',
                )
            }),
        ))

    it("should throw error when SELECT column count does not match INSERT column count", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // INSERT has 2 columns but SELECT only has 1
                expect(() => {
                    dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(User, ["name", "memberId"])
                        .valuesFromSelect(
                            dataSource
                                .createQueryBuilder()
                                .select("user.name")
                                .from(User, "user"),
                        )
                }).to.throw(
                    "The number of columns in the SELECT query (1) " +
                        "does not match the number of columns specified for INSERT (2).",
                )
            }),
        ))
})
