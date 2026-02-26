import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { User } from "./entity/User"
import { Organization } from "./entity/Organization"

describe("class-table-inheritance > column-name-collision", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Actor, User, Organization],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should preserve distinct status values when children share a column name", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@test.com"
                user.status = "active"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.status = "verified"
                await connection.getRepository(Organization).save(org)

                // Query parent repository (polymorphic) - this is where alias collision occurs
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.name).to.equal("Alice")
                expect(loadedUser.email).to.equal("alice@test.com")
                expect(loadedUser.status).to.equal("active")

                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.name).to.equal("Acme")
                expect(loadedOrg.industry).to.equal("Tech")
                expect(loadedOrg.status).to.equal("verified")
            }),
        ))

    it("should hydrate correct status via findOne on parent repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Bob"
                user.email = "bob@test.com"
                user.status = "suspended"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Corp"
                org.industry = "Finance"
                org.status = "active"
                await connection.getRepository(Organization).save(org)

                // findOne on parent - should hydrate correct child status
                const loadedUser = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: user.id } })
                expect(loadedUser).to.be.instanceOf(User)
                expect((loadedUser as User).status).to.equal("suspended")

                const loadedOrg = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: org.id } })
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect((loadedOrg as Organization).status).to.equal("active")
            }),
        ))

    it("should handle QueryBuilder parent query with same-named child columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Charlie"
                user.email = "charlie@test.com"
                user.status = "active"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "StartupCo"
                org.industry = "AI"
                org.status = "pending"
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("actor")
                    .orderBy("actor.id", "ASC")
                    .getMany()

                expect(actors).to.have.length(2)
                expect((actors[0] as User).status).to.equal("active")
                expect((actors[1] as Organization).status).to.equal("pending")
            }),
        ))
})
