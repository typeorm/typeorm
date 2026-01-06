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
})
