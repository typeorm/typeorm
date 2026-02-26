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
import { Authorization } from "./entity/Authorization"
import { Profile } from "./entity/Profile"
import { expect } from "chai"

/**
 * Tests for querying CTI root entities that extend abstract base classes,
 * use UUID primary keys, and have eager + non-eager relations.
 *
 * This reproduces the pattern from the Alkemio app:
 *   BaseAlkemioEntity (uuid PK, dates, version) →
 *     AuthorizableEntity (eager authorization OneToOne) →
 *       NameableEntity (nameID, profile OneToOne) →
 *         Actor (CTI root) → User / Organization
 *
 * Bug #4: findOne(Actor, ...) on CTI root entity was generating zero SQL.
 */
describe("table-inheritance > class-table > cti-root-findone", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // Helper: insert a User via child repo
    async function insertUser(
        connection: DataSource,
        nameID: string,
        email: string,
    ): Promise<User> {
        const auth = new Authorization()
        auth.credentialRules = "user-rules"
        const profile = new Profile()
        profile.displayName = nameID

        const user = new User()
        user.nameID = nameID
        user.email = email
        user.authorization = auth
        user.profile = profile
        return connection.getRepository(User).save(user)
    }

    // Helper: insert an Organization via child repo
    async function insertOrg(
        connection: DataSource,
        nameID: string,
        industry: string,
    ): Promise<Organization> {
        const auth = new Authorization()
        auth.credentialRules = "org-rules"
        const profile = new Profile()
        profile.displayName = nameID

        const org = new Organization()
        org.nameID = nameID
        org.industry = industry
        org.authorization = auth
        org.profile = profile
        return connection.getRepository(Organization).save(org)
    }

    // ===================================================================
    // (a) entityManager.findOne(Actor, { where: { id } }) — the Bug #4 case
    // ===================================================================
    it("should return entity via entityManager.findOne(Actor) with UUID PK", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.id).to.equal(saved.id)
                expect(loaded).to.be.instanceOf(User)
                // Root-table columns are populated; child-specific columns are undefined
                expect(loaded!.nameID).to.equal("alice")
                expect((loaded as User).email).to.be.undefined

                // Verify child data by querying child entity directly
                const user = await connection
                    .getRepository(User)
                    .findOne({ where: { id: saved.id } })
                expect(user).to.not.be.null
                expect(user!.email).to.equal("alice@test.com")
            }),
        ))

    // ===================================================================
    // (b) entityManager.find(Actor, { where: { id: In([...]) } })
    // ===================================================================
    it("should return entities via entityManager.find(Actor) with UUID PKs", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )
                const org = await insertOrg(connection, "acme", "Tech")

                const actors = await connection.manager.find(Actor, {
                    where: [{ id: user.id }, { id: org.id }],
                    order: { nameID: "ASC" },
                })

                expect(actors).to.have.length(2)
                // "acme" < "alice" alphabetically
                expect(actors[0]).to.be.instanceOf(Organization)
                expect(actors[1]).to.be.instanceOf(User)
            }),
        ))

    // ===================================================================
    // (c) entityManager.findOne(Actor) with eager relation (authorization)
    // ===================================================================
    it("should load eager authorization relation when querying root Actor", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.authorization).to.not.be.undefined
                expect(loaded!.authorization.credentialRules).to.equal(
                    "user-rules",
                )
            }),
        ))

    // ===================================================================
    // (d) entityManager.findOne(Actor) with explicit non-eager relation
    // ===================================================================
    it("should load non-eager profile relation when requested explicitly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                    relations: { profile: true },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.profile).to.not.be.undefined
                expect(loaded!.profile.displayName).to.equal("alice")
            }),
        ))

    // ===================================================================
    // (e) entityManager.findOne(Actor) with select subset + loadEagerRelations: false
    // ===================================================================
    it("should work with select subset and loadEagerRelations: false", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                    select: { id: true },
                    loadEagerRelations: false,
                })

                expect(loaded).to.not.be.null
                expect(loaded!.id).to.equal(saved.id)
            }),
        ))

    // ===================================================================
    // (f) entityManager.count(Actor)
    // ===================================================================
    it("should return correct count via entityManager.count(Actor)", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@test.com")
                await insertUser(connection, "bob", "bob@test.com")
                await insertOrg(connection, "acme", "Tech")

                const count = await connection.manager.count(Actor, {
                    where: {},
                })

                expect(count).to.equal(3)
            }),
        ))

    // ===================================================================
    // (g) getRepository(Actor).findOneBy() — this was known to work
    // ===================================================================
    it("should work via getRepository(Actor).findOneBy()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection
                    .getRepository(Actor)
                    .findOneBy({ id: saved.id })

                expect(loaded).to.not.be.null
                expect(loaded!.id).to.equal(saved.id)
                expect(loaded).to.be.instanceOf(User)
            }),
        ))

    // ===================================================================
    // (h) findOne(Actor) returns null for non-existent ID
    // ===================================================================
    it("should return null for non-existent UUID", () =>
        Promise.all(
            connections.map(async (connection) => {
                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: "00000000-0000-0000-0000-000000000000" },
                })

                expect(loaded).to.be.null
            }),
        ))

    // ===================================================================
    // (i) version and timestamps work correctly on root entity query
    // ===================================================================
    it("should have version and timestamps after querying root Actor", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.version).to.equal(1)
                expect(loaded!.createdDate).to.be.instanceOf(Date)
                expect(loaded!.updatedDate).to.be.instanceOf(Date)
            }),
        ))

    // ===================================================================
    // (j) entityManager.findOne(Actor) with relations: { authorization: true }
    //     Pattern from user's getActorAuthorizationOrFail method
    // ===================================================================
    it("should load authorization when explicitly requested via relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const loaded = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                    relations: { authorization: true },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.authorization).to.not.be.undefined
                expect(loaded!.authorization.credentialRules).to.equal(
                    "user-rules",
                )
            }),
        ))
})
