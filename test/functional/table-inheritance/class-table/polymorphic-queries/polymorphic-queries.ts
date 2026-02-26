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

describe("table-inheritance > class-table > polymorphic-queries", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should return correct child types when querying parent repository via find()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                const org1 = new Organization()
                org1.name = "Acme Corp"
                org1.industry = "Technology"
                await connection.getRepository(Organization).save(org1)

                // Query parent repository — should return mixed child types
                const allActors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(allActors).to.have.length(3)

                // First two should be Users
                expect(allActors[0]).to.be.instanceOf(User)
                expect((allActors[0] as User).email).to.equal(
                    "alice@example.com",
                )
                expect(allActors[0].name).to.equal("Alice")

                expect(allActors[1]).to.be.instanceOf(User)
                expect((allActors[1] as User).email).to.equal(
                    "bob@example.com",
                )

                // Third should be Organization
                expect(allActors[2]).to.be.instanceOf(Organization)
                expect((allActors[2] as Organization).industry).to.equal(
                    "Technology",
                )
                expect(allActors[2].name).to.equal("Acme Corp")
            }),
        ))

    it("should return correct child types via parent createQueryBuilder", () =>
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

                const actors = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("actor")
                    .orderBy("actor.id", "ASC")
                    .getMany()

                expect(actors).to.have.length(2)
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[1]).to.be.instanceOf(Organization)
            }),
        ))

    it("should return correct child type via parent findOneBy", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(Actor)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded).to.be.instanceOf(User)
                expect((loaded as User).email).to.equal("alice@example.com")
                expect(loaded!.name).to.equal("Alice")
            }),
        ))

    it("should return null from parent findOneBy when ID does not exist", () =>
        Promise.all(
            connections.map(async (connection) => {
                const loaded = await connection
                    .getRepository(Actor)
                    .findOneBy({ id: 99999 })

                expect(loaded).to.be.null
            }),
        ))

    it("should return correct counts per entity type", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@example.com"
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Bob"
                user2.email = "bob@example.com"
                await connection.getRepository(User).save(user2)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const totalCount = await connection
                    .getRepository(Actor)
                    .count()
                expect(totalCount).to.equal(3)

                const userCount = await connection
                    .getRepository(User)
                    .count()
                expect(userCount).to.equal(2)

                const orgCount = await connection
                    .getRepository(Organization)
                    .count()
                expect(orgCount).to.equal(1)
            }),
        ))

    it("should filter polymorphic results with where clause on parent column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Alice Corp"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                // Filter by name from parent repo
                const results = await connection
                    .getRepository(Actor)
                    .find({ where: { name: "Alice" } })

                expect(results).to.have.length(1)
                expect(results[0]).to.be.instanceOf(User)
            }),
        ))

    it("should not have sibling's child-specific properties on instances", () =>
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

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                const loadedUser = actors[0] as User
                const loadedOrg = actors[1] as Organization

                // User should have email, not industry
                expect(loadedUser.email).to.equal("alice@example.com")
                expect(loadedUser).to.not.have.property("industry")

                // Organization should have industry, not email
                expect(loadedOrg.industry).to.equal("Tech")
                expect(loadedOrg).to.not.have.property("email")
            }),
        ))
})
