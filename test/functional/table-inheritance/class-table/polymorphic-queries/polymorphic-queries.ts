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

                // Query parent repository — returns mixed child types
                const allActors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(allActors).to.have.length(3)

                // First two should be Users; root-table column (name) is populated
                expect(allActors[0]).to.be.instanceOf(User)
                expect(allActors[0].name).to.equal("Alice")
                // Child-specific columns are undefined from parent repo query
                expect((allActors[0] as User).email).to.be.undefined

                expect(allActors[1]).to.be.instanceOf(User)
                expect(allActors[1].name).to.equal("Bob")
                expect((allActors[1] as User).email).to.be.undefined

                // Third should be Organization; root-table column (name) is populated
                expect(allActors[2]).to.be.instanceOf(Organization)
                expect(allActors[2].name).to.equal("Acme Corp")
                // Child-specific columns are undefined from parent repo query
                expect((allActors[2] as Organization).industry).to.be.undefined

                // Verify child data by querying child entities directly
                const fullUser1 = await connection
                    .getRepository(User)
                    .findOneBy({ id: user1.id })
                expect(fullUser1!.email).to.equal("alice@example.com")

                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org1.id })
                expect(fullOrg!.industry).to.equal("Technology")
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
                // Root-table column is populated
                expect(loaded!.name).to.equal("Alice")
                // Child-specific column is undefined from parent repo query
                expect((loaded as User).email).to.be.undefined

                // Verify child data by querying child entity directly
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.email).to.equal("alice@example.com")
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

                // From parent repo query, child-specific columns are undefined;
                // siblings should not have each other's properties
                expect(loadedUser).to.not.have.property("industry")
                expect(loadedOrg).to.not.have.property("email")

                // Verify child data by querying child entities directly
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.email).to.equal("alice@example.com")
                expect(fullUser).to.not.have.property("industry")

                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(fullOrg!.industry).to.equal("Tech")
                expect(fullOrg).to.not.have.property("email")
            }),
        ))
})
