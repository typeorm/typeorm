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

describe("table-inheritance > class-table > basic-functionality", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create separate tables for parent and child entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify that separate tables exist
                const actorTable = await queryRunner.getTable("actor")
                expect(actorTable).to.not.be.undefined

                const userTable = await queryRunner.getTable("user")
                expect(userTable).to.not.be.undefined

                const organizationTable =
                    await queryRunner.getTable("organization")
                expect(organizationTable).to.not.be.undefined

                // Verify parent table has shared columns + discriminator
                const actorColumns = actorTable!.columns.map(
                    (c) => c.name,
                )
                expect(actorColumns).to.include("id")
                expect(actorColumns).to.include("name")
                expect(actorColumns).to.include("type")

                // Verify child tables have only child-specific columns + PK
                const userColumns = userTable!.columns.map((c) => c.name)
                expect(userColumns).to.include("id")
                expect(userColumns).to.include("email")
                expect(userColumns).to.not.include("name")
                expect(userColumns).to.not.include("type")

                const orgColumns = organizationTable!.columns.map(
                    (c) => c.name,
                )
                expect(orgColumns).to.include("id")
                expect(orgColumns).to.include("industry")
                expect(orgColumns).to.not.include("name")
                expect(orgColumns).to.not.include("type")

                await queryRunner.release()
            }),
        ))

    it("should correctly insert and read CTI child entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a User
                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                // Create an Organization
                const org1 = new Organization()
                org1.name = "Acme Corp"
                org1.industry = "Technology"
                await connection.getRepository(Organization).save(org1)

                // Read Users — should return only Users with all properties
                const loadedUsers = await connection
                    .getRepository(User)
                    .find({ order: { id: "ASC" } })

                expect(loadedUsers).to.have.length(2)
                expect(loadedUsers[0].name).to.equal("Alice")
                expect(loadedUsers[0].email).to.equal("alice@example.com")
                expect(loadedUsers[1].name).to.equal("Bob")
                expect(loadedUsers[1].email).to.equal("bob@example.com")

                // Read Organizations — should return only Organizations
                const loadedOrgs = await connection
                    .getRepository(Organization)
                    .find()

                expect(loadedOrgs).to.have.length(1)
                expect(loadedOrgs[0].name).to.equal("Acme Corp")
                expect(loadedOrgs[0].industry).to.equal("Technology")
            }),
        ))

    it("should correctly update CTI child entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a User
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Update child-specific column
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loadedUser!.email).to.equal("newalice@example.com")
                expect(loadedUser!.name).to.equal("Alice")

                // Update parent column
                user.name = "Alice Updated"
                await connection.getRepository(User).save(user)

                const reloadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(reloadedUser!.name).to.equal("Alice Updated")
                expect(reloadedUser!.email).to.equal("newalice@example.com")
            }),
        ))

    it("should correctly delete CTI child entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a User
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)
                const userId = user.id

                // Delete the user
                await connection.getRepository(User).remove(user)

                // Verify user is gone from both tables
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: userId })
                expect(loadedUser).to.be.null

                // Also verify parent table row is gone
                const queryRunner = connection.createQueryRunner()
                const parentRows = await queryRunner.query(
                    `SELECT * FROM "actor" WHERE "id" = ${userId}`,
                )
                expect(parentRows).to.have.length(0)
                await queryRunner.release()
            }),
        ))
})
