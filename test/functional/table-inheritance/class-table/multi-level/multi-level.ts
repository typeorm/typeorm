import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { Contributor } from "./entity/Contributor"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { expect } from "chai"

describe("table-inheritance > class-table > multi-level", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // =========================================================================
    // Schema Tests
    // =========================================================================

    it("should create separate tables for each level: actor, contributor, user, organization", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                try {
                    const actorTable = await queryRunner.getTable("actor")
                    const contributorTable =
                        await queryRunner.getTable("contributor")
                    const userTable = await queryRunner.getTable("user")
                    const organizationTable =
                        await queryRunner.getTable("organization")

                    expect(actorTable).to.not.be.undefined
                    expect(contributorTable).to.not.be.undefined
                    expect(userTable).to.not.be.undefined
                    expect(organizationTable).to.not.be.undefined

                    // Actor (root): id, name, type (discriminator)
                    const actorColumnNames = actorTable!.columns.map(
                        (c) => c.name,
                    )
                    expect(actorColumnNames).to.include("id")
                    expect(actorColumnNames).to.include("name")
                    expect(actorColumnNames).to.include("type")

                    // Contributor (mid-level): id, reputation (NOT name, NOT type)
                    const contributorColumnNames =
                        contributorTable!.columns.map((c) => c.name)
                    expect(contributorColumnNames).to.include("id")
                    expect(contributorColumnNames).to.include("reputation")
                    expect(contributorColumnNames).to.not.include("name")
                    expect(contributorColumnNames).to.not.include("type")

                    // User (leaf): id, email (NOT name, NOT reputation, NOT type)
                    const userColumnNames = userTable!.columns.map(
                        (c) => c.name,
                    )
                    expect(userColumnNames).to.include("id")
                    expect(userColumnNames).to.include("email")
                    expect(userColumnNames).to.not.include("name")
                    expect(userColumnNames).to.not.include("reputation")
                    expect(userColumnNames).to.not.include("type")

                    // Organization (direct child): id, industry (NOT name, NOT type)
                    const orgColumnNames = organizationTable!.columns.map(
                        (c) => c.name,
                    )
                    expect(orgColumnNames).to.include("id")
                    expect(orgColumnNames).to.include("industry")
                    expect(orgColumnNames).to.not.include("name")
                    expect(orgColumnNames).to.not.include("type")
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    // =========================================================================
    // Basic CRUD for 3-level entity (User → Contributor → Actor)
    // =========================================================================

    it("should insert and read a 3-level entity (User) with all ancestor columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Alice")
                expect(loaded!.reputation).to.equal(100)
                expect(loaded!.email).to.equal("alice@example.com")
            }),
        ))

    it("should update columns at all 3 levels", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Update all levels
                user.name = "Alice Updated"
                user.reputation = 200
                user.email = "alice-new@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded!.name).to.equal("Alice Updated")
                expect(loaded!.reputation).to.equal(200)
                expect(loaded!.email).to.equal("alice-new@example.com")
            }),
        ))

    it("should delete a 3-level entity from all tables", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)
                const savedId = user.id

                await connection.getRepository(User).remove(user)

                // Verify all tables are cleaned up
                const actorRows = await connection.query(
                    `SELECT * FROM "actor" WHERE "id" = ${savedId}`,
                )
                const contributorRows = await connection.query(
                    `SELECT * FROM "contributor" WHERE "id" = ${savedId}`,
                )
                const userRows = await connection.query(
                    `SELECT * FROM "user" WHERE "id" = ${savedId}`,
                )

                expect(actorRows).to.have.length(0)
                expect(contributorRows).to.have.length(0)
                expect(userRows).to.have.length(0)
            }),
        ))

    // =========================================================================
    // Raw Data Integrity for 3-level hierarchy
    // =========================================================================

    it("should distribute data correctly across 3 tables", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Actor table: id, name, type=User
                const actorRows = await connection.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRows).to.have.length(1)
                expect(actorRows[0].name).to.equal("Alice")
                expect(actorRows[0].type).to.equal("User")

                // Contributor table: id, reputation
                const contributorRows = await connection.query(
                    `SELECT * FROM "contributor" WHERE "id" = ${user.id}`,
                )
                expect(contributorRows).to.have.length(1)
                expect(contributorRows[0].reputation).to.equal(100)
                // Contributor table should NOT have name or type
                expect(contributorRows[0].name).to.be.undefined
                expect(contributorRows[0].type).to.be.undefined

                // User table: id, email
                const userRows = await connection.query(
                    `SELECT * FROM "user" WHERE "id" = ${user.id}`,
                )
                expect(userRows).to.have.length(1)
                expect(userRows[0].email).to.equal("alice@example.com")
                expect(userRows[0].name).to.be.undefined
                expect(userRows[0].reputation).to.be.undefined
            }),
        ))

    it("should share the same PK across all 3 tables", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const actorRows = await connection.query(
                    `SELECT "id" FROM "actor" WHERE "id" = ${user.id}`,
                )
                const contributorRows = await connection.query(
                    `SELECT "id" FROM "contributor" WHERE "id" = ${user.id}`,
                )
                const userRows = await connection.query(
                    `SELECT "id" FROM "user" WHERE "id" = ${user.id}`,
                )

                expect(actorRows[0].id).to.equal(user.id)
                expect(contributorRows[0].id).to.equal(user.id)
                expect(userRows[0].id).to.equal(user.id)
            }),
        ))

    // =========================================================================
    // Mid-level entity (Contributor) CRUD
    // =========================================================================

    it("should insert and read a mid-level entity (Contributor)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const contrib = new Contributor()
                contrib.name = "Bob"
                contrib.reputation = 50
                await connection.getRepository(Contributor).save(contrib)

                const loaded = await connection
                    .getRepository(Contributor)
                    .findOneBy({ id: contrib.id })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Bob")
                expect(loaded!.reputation).to.equal(50)
                // Contributor should NOT have email
                expect((loaded as any).email).to.be.undefined
            }),
        ))

    // =========================================================================
    // Polymorphic Queries
    // =========================================================================

    it("should return all types when querying root Actor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const contrib = new Contributor()
                contrib.name = "Bob"
                contrib.reputation = 50
                await connection.getRepository(Contributor).save(contrib)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(3)

                // Each should be the correct instance type
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[1]).to.be.instanceOf(Contributor)
                expect(actors[2]).to.be.instanceOf(Organization)

                // Each should have its own properties
                const loadedUser = actors[0] as User
                expect(loadedUser.name).to.equal("Alice")
                expect(loadedUser.reputation).to.equal(100)
                expect(loadedUser.email).to.equal("alice@example.com")

                const loadedContrib = actors[1] as Contributor
                expect(loadedContrib.name).to.equal("Bob")
                expect(loadedContrib.reputation).to.equal(50)

                const loadedOrg = actors[2] as Organization
                expect(loadedOrg.name).to.equal("Acme")
                expect(loadedOrg.industry).to.equal("Tech")
            }),
        ))

    it("should return Contributor and User when querying Contributor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const contrib = new Contributor()
                contrib.name = "Bob"
                contrib.reputation = 50
                await connection.getRepository(Contributor).save(contrib)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const contributors = await connection
                    .getRepository(Contributor)
                    .find({ order: { id: "ASC" } })

                // Should NOT include Organization (different branch)
                expect(contributors).to.have.length(2)
                expect(contributors[0]).to.be.instanceOf(User)
                expect(contributors[1]).to.be.instanceOf(Contributor)

                const loadedUser = contributors[0] as User
                expect(loadedUser.email).to.equal("alice@example.com")
                expect(loadedUser.reputation).to.equal(100)
                expect(loadedUser.name).to.equal("Alice")
            }),
        ))

    // =========================================================================
    // Query Builder with grandparent columns
    // =========================================================================

    it("should WHERE on grandparent column from leaf query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alice"
                user1.reputation = 100
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Bob"
                user2.reputation = 200
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                // WHERE on grandparent column (name is on Actor table)
                const result = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.name = :name", { name: "Alice" })
                    .getOne()

                expect(result).to.not.be.null
                expect(result!.email).to.equal("alice@example.com")
            }),
        ))

    it("should ORDER BY grandparent column from leaf query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Bob"
                user1.reputation = 100
                user1.email = "bob@example.com"
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Alice"
                user2.reputation = 200
                user2.email = "alice@example.com"
                await connection.getRepository(User).save(user2)

                const result = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .orderBy("u.name", "ASC")
                    .getMany()

                expect(result).to.have.length(2)
                expect(result[0].name).to.equal("Alice")
                expect(result[1].name).to.equal("Bob")
            }),
        ))

    it("should WHERE on parent column from leaf query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alice"
                user1.reputation = 100
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Bob"
                user2.reputation = 200
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                // WHERE on parent column (reputation is on Contributor table)
                const result = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.reputation > :rep", { rep: 150 })
                    .getOne()

                expect(result).to.not.be.null
                expect(result!.email).to.equal("bob@example.com")
            }),
        ))

    it("should findBy on grandparent column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ name: "Alice" })

                expect(loaded).to.not.be.null
                expect(loaded!.email).to.equal("alice@example.com")
            }),
        ))

    // =========================================================================
    // Mixed-depth siblings
    // =========================================================================

    it("should handle mixed-depth siblings (depth-1 Organization + depth-2 User)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                // Load both from User repo — only User
                const users = await connection.getRepository(User).find()
                expect(users).to.have.length(1)
                expect(users[0].email).to.equal("alice@example.com")

                // Load both from Organization repo — only Organization
                const orgs = await connection.getRepository(Organization).find()
                expect(orgs).to.have.length(1)
                expect(orgs[0].industry).to.equal("Tech")

                // Load from Actor repo — both
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })
                expect(actors).to.have.length(2)
            }),
        ))

    // =========================================================================
    // Count operations
    // =========================================================================

    it("should count correctly at each level", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.reputation = 100
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const contrib = new Contributor()
                contrib.name = "Bob"
                contrib.reputation = 50
                await connection.getRepository(Contributor).save(contrib)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const actorCount = await connection
                    .getRepository(Actor)
                    .count()
                const contributorCount = await connection
                    .getRepository(Contributor)
                    .count()
                const userCount = await connection.getRepository(User).count()
                const orgCount = await connection
                    .getRepository(Organization)
                    .count()

                expect(actorCount).to.equal(3)
                expect(contributorCount).to.equal(2) // Contributor + User
                expect(userCount).to.equal(1)
                expect(orgCount).to.equal(1)
            }),
        ))
})
