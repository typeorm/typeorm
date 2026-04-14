import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { expect } from "chai"

describe("table-inheritance > class-table > query-builder-operations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    async function seedData(connection: DataSource) {
        const user1 = new User()
        user1.name = "Alice"
        user1.email = "alice@example.com"
        await connection.getRepository(User).save(user1)

        const user2 = new User()
        user2.name = "Bob"
        user2.email = "bob@example.com"
        await connection.getRepository(User).save(user2)

        const user3 = new User()
        user3.name = "Charlie"
        user3.email = "charlie@example.com"
        await connection.getRepository(User).save(user3)

        const org1 = new Organization()
        org1.name = "Acme Corp"
        org1.industry = "Technology"
        await connection.getRepository(Organization).save(org1)

        const org2 = new Organization()
        org2.name = "Globex Inc"
        org2.industry = "Finance"
        await connection.getRepository(Organization).save(org2)

        return { user1, user2, user3, org1, org2 }
    }

    it("should filter by child column in WHERE clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const result = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.email = :e", { e: "alice@example.com" })
                    .getOne()

                expect(result).to.not.be.null
                expect(result!.name).to.equal("Alice")
                expect(result!.email).to.equal("alice@example.com")
            }),
        ))

    it("should filter by parent column in WHERE clause via child QB", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const result = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.name = :n", { n: "Alice" })
                    .getOne()

                expect(result).to.not.be.null
                expect(result!.email).to.equal("alice@example.com")
            }),
        ))

    it("should ORDER BY parent column via child QB", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const users = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .orderBy("u.name", "ASC")
                    .getMany()

                expect(users).to.have.length(3)
                expect(users[0].name).to.equal("Alice")
                expect(users[1].name).to.equal("Bob")
                expect(users[2].name).to.equal("Charlie")
            }),
        ))

    it("should ORDER BY child column via child QB", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const users = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .orderBy("u.email", "DESC")
                    .getMany()

                expect(users).to.have.length(3)
                expect(users[0].email).to.equal("charlie@example.com")
                expect(users[1].email).to.equal("bob@example.com")
                expect(users[2].email).to.equal("alice@example.com")
            }),
        ))

    it("should use mixed parent+child columns in WHERE", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const result = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.name = :n AND u.email = :e", {
                        n: "Alice",
                        e: "alice@example.com",
                    })
                    .getOne()

                expect(result).to.not.be.null
                expect(result!.name).to.equal("Alice")

                // Non-matching combo should return null
                const noResult = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.name = :n AND u.email = :e", {
                        n: "Alice",
                        e: "bob@example.com",
                    })
                    .getOne()

                expect(noResult).to.be.null
            }),
        ))

    it("should support getCount() on child entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const userCount = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .getCount()

                expect(userCount).to.equal(3)
            }),
        ))

    it("should support getCount() on parent entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const totalCount = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("a")
                    .getCount()

                expect(totalCount).to.equal(5)
            }),
        ))

    it("should support getRawMany() with parent and child columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const rawResults = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .select(["u.name", "u.email"])
                    .orderBy("u.name", "ASC")
                    .getRawMany()

                expect(rawResults).to.have.length(3)
                expect(rawResults[0].u_name).to.equal("Alice")
                expect(rawResults[0].u_email).to.equal("alice@example.com")
            }),
        ))

    it("should support WHERE with LIKE on parent column", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const results = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("a")
                    .where("a.name LIKE :pattern", { pattern: "%Corp%" })
                    .getMany()

                expect(results).to.have.length(1)
                expect(results[0]).to.be.instanceOf(Organization)
                expect(results[0].name).to.equal("Acme Corp")
            }),
        ))

    it("should support limit and offset on child QB", () =>
        Promise.all(
            connections.map(async (connection) => {
                await seedData(connection)

                const users = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .orderBy("u.name", "ASC")
                    .skip(1)
                    .take(1)
                    .getMany()

                expect(users).to.have.length(1)
                expect(users[0].name).to.equal("Bob")
            }),
        ))

    it("should support delete via QueryBuilder on child entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { user1 } = await seedData(connection)

                await connection
                    .getRepository(User)
                    .createQueryBuilder()
                    .delete()
                    .from(User)
                    .where("id = :id", { id: user1.id })
                    .execute()

                const remaining = await connection
                    .getRepository(User)
                    .find()

                expect(remaining).to.have.length(2)
            }),
        ))

    it("should support update via QueryBuilder on child-specific column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const { user1 } = await seedData(connection)

                await connection
                    .getRepository(User)
                    .createQueryBuilder()
                    .update(User)
                    .set({ email: "updated@example.com" })
                    .where("id = :id", { id: user1.id })
                    .execute()

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user1.id })

                expect(loaded!.email).to.equal("updated@example.com")
                expect(loaded!.name).to.equal("Alice") // parent column unchanged
            }),
        ))
})
