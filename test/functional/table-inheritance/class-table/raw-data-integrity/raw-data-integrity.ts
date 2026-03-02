import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"
import { expect } from "chai"

describe("table-inheritance > class-table > raw-data-integrity", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should store parent columns only in parent table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                // Parent table should have id, name, type
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRows).to.have.length(1)
                expect(actorRows[0].name).to.equal("Alice")
                expect(actorRows[0].type).to.equal("User")

                // Child table should have id, email — NOT name
                const userRows = await qr.query(
                    `SELECT * FROM "user" WHERE "id" = ${user.id}`,
                )
                expect(userRows).to.have.length(1)
                expect(userRows[0].email).to.equal("alice@example.com")
                expect(userRows[0].name).to.be.undefined

                await qr.release()
            }),
        ))

    it("should store correct discriminator values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const qr = connection.createQueryRunner()
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" ORDER BY "id" ASC`,
                )

                expect(actorRows[0].type).to.equal("User")
                expect(actorRows[1].type).to.equal("Organization")

                await qr.release()
            }),
        ))

    it("should share the same PK across parent and child tables", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Insert two users first to push the serial counter
                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const qr = connection.createQueryRunner()

                // User: actor.id should equal user.id
                const userActorRow = await qr.query(
                    `SELECT "id" FROM "actor" WHERE "type" = 'User'`,
                )
                const userRow = await qr.query(
                    `SELECT "id" FROM "user"`,
                )
                expect(userActorRow[0].id).to.equal(userRow[0].id)

                // Org: actor.id should equal organization.id
                const orgActorRow = await qr.query(
                    `SELECT "id" FROM "actor" WHERE "type" = 'Organization'`,
                )
                const orgRow = await qr.query(
                    `SELECT "id" FROM "organization"`,
                )
                expect(orgActorRow[0].id).to.equal(orgRow[0].id)

                await qr.release()
            }),
        ))

    it("should update only parent table when only parent column changes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Update only parent column
                user.name = "Alice Updated"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                const actorRow = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRow[0].name).to.equal("Alice Updated")

                const userRow = await qr.query(
                    `SELECT * FROM "user" WHERE "id" = ${user.id}`,
                )
                expect(userRow[0].email).to.equal("alice@example.com")

                await qr.release()
            }),
        ))

    it("should update only child table when only child column changes", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Update only child column
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                const actorRow = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRow[0].name).to.equal("Alice")

                const userRow = await qr.query(
                    `SELECT * FROM "user" WHERE "id" = ${user.id}`,
                )
                expect(userRow[0].email).to.equal("newalice@example.com")

                await qr.release()
            }),
        ))

    it("should update both tables when both parent and child columns change", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Update both
                user.name = "Alice Updated"
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                const actorRow = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRow[0].name).to.equal("Alice Updated")

                const userRow = await qr.query(
                    `SELECT * FROM "user" WHERE "id" = ${user.id}`,
                )
                expect(userRow[0].email).to.equal("newalice@example.com")

                await qr.release()
            }),
        ))

    it("should delete from both tables on remove", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)
                const userId = user.id

                await connection.getRepository(User).remove(user)

                const qr = connection.createQueryRunner()

                const actorRows = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${userId}`,
                )
                expect(actorRows).to.have.length(0)

                const userRows = await qr.query(
                    `SELECT * FROM "user" WHERE "id" = ${userId}`,
                )
                expect(userRows).to.have.length(0)

                await qr.release()
            }),
        ))

    it("should maintain correct data after multiple inserts of different types", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Interleave user and org inserts
                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const org1 = new Organization()
                org1.name = "Acme"
                org1.industry = "Tech"
                await connection.getRepository(Organization).save(org1)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                const org2 = new Organization()
                org2.name = "Globex"
                org2.industry = "Finance"
                await connection.getRepository(Organization).save(org2)

                const qr = connection.createQueryRunner()

                // Actor table should have 4 rows
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" ORDER BY "id" ASC`,
                )
                expect(actorRows).to.have.length(4)

                // User table should have 2 rows
                const userRows = await qr.query(
                    `SELECT * FROM "user" ORDER BY "id" ASC`,
                )
                expect(userRows).to.have.length(2)

                // Organization table should have 2 rows
                const orgRows = await qr.query(
                    `SELECT * FROM "organization" ORDER BY "id" ASC`,
                )
                expect(orgRows).to.have.length(2)

                // Verify PK alignment
                expect(userRows[0].id).to.equal(actorRows[0].id) // Alice
                expect(orgRows[0].id).to.equal(actorRows[1].id) // Acme
                expect(userRows[1].id).to.equal(actorRows[2].id) // Bob
                expect(orgRows[1].id).to.equal(actorRows[3].id) // Globex

                await qr.release()
            }),
        ))
})
