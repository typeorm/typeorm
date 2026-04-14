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

describe("table-inheritance > class-table > edge-cases", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should handle multiple children of the same type", () =>
        Promise.all(
            connections.map(async (connection) => {
                for (let i = 0; i < 5; i++) {
                    const user = new User()
                    user.name = `User${i}`
                    user.email = `user${i}@example.com`
                    await connection.getRepository(User).save(user)
                }

                const users = await connection
                    .getRepository(User)
                    .find({ order: { id: "ASC" } })
                expect(users).to.have.length(5)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })
                expect(actors).to.have.length(5)
                actors.forEach((a) => expect(a).to.be.instanceOf(User))
            }),
        ))

    it("should handle empty result sets", () =>
        Promise.all(
            connections.map(async (connection) => {
                const users = await connection.getRepository(User).find()
                expect(users).to.have.length(0)

                const actors = await connection.getRepository(Actor).find()
                expect(actors).to.have.length(0)

                const orgs = await connection
                    .getRepository(Organization)
                    .find()
                expect(orgs).to.have.length(0)
            }),
        ))

    it("should correctly detect update vs insert on re-save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const originalId = user.id

                // Modify and re-save — should update, not create new row
                user.name = "Alice Updated"
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.id).to.equal(originalId) // same ID

                const allUsers = await connection.getRepository(User).find()
                expect(allUsers).to.have.length(1) // still just 1 row
                expect(allUsers[0].name).to.equal("Alice Updated")
                expect(allUsers[0].email).to.equal("newalice@example.com")
            }),
        ))

    it("should handle simultaneous parent and child column updates in single save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                user.name = "Alice Updated"
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded!.name).to.equal("Alice Updated")
                expect(loaded!.email).to.equal("newalice@example.com")
            }),
        ))

    it("should support findBy with conditions on child columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                const results = await connection
                    .getRepository(User)
                    .findBy({ email: "alice@example.com" })

                expect(results).to.have.length(1)
                expect(results[0].name).to.equal("Alice")
            }),
        ))

    it("should support findBy with conditions on parent columns from child repo", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                const results = await connection
                    .getRepository(User)
                    .findBy({ name: "Alice" })

                expect(results).to.have.length(1)
                expect(results[0].email).to.equal("alice@example.com")
            }),
        ))

    it("should preserve entity identity after load-modify-save cycle", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Load fresh
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded).to.not.be.null

                // Modify and save
                loaded!.name = "Alice Reloaded"
                await connection.getRepository(User).save(loaded!)

                // Verify
                const reloaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(reloaded!.name).to.equal("Alice Reloaded")
                expect(reloaded!.email).to.equal("alice@example.com")
            }),
        ))

    it("should handle deleting one child type without affecting another", () =>
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

                // Delete user — org should remain
                await connection.getRepository(User).remove(user)

                const remainingOrgs = await connection
                    .getRepository(Organization)
                    .find()
                expect(remainingOrgs).to.have.length(1)
                expect(remainingOrgs[0].name).to.equal("Acme")

                // Actor should only have org
                const remainingActors = await connection
                    .getRepository(Actor)
                    .find()
                expect(remainingActors).to.have.length(1)
                expect(remainingActors[0]).to.be.instanceOf(Organization)
            }),
        ))

    it("should return correct entity from findOneOrFail", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneOrFail({ where: { id: user.id } })

                expect(loaded.name).to.equal("Alice")
                expect(loaded.email).to.equal("alice@example.com")
            }),
        ))

    it("should throw on findOneOrFail for non-existent entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                let error: Error | undefined
                try {
                    await connection
                        .getRepository(User)
                        .findOneOrFail({ where: { id: 99999 } })
                } catch (e) {
                    error = e as Error
                }
                expect(error).to.not.be.undefined
            }),
        ))

    it("should handle sequential insert-delete-insert of same entity type", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Insert
                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)
                const firstId = user1.id

                // Delete
                await connection.getRepository(User).remove(user1)

                // Insert again
                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                // New user should have different ID
                expect(user2.id).to.not.equal(firstId)

                const allUsers = await connection.getRepository(User).find()
                expect(allUsers).to.have.length(1)
                expect(allUsers[0].name).to.equal("Bob")
            }),
        ))

    it("should correctly save entities from parent repository using manager.save()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"

                // Save via manager (not child repository)
                await connection.manager.save(user)
                await connection.manager.save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[1]).to.be.instanceOf(Organization)
            }),
        ))
})
