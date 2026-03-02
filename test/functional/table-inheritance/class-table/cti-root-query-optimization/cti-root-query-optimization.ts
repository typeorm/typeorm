import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "../cti-root-findone/entity/Actor"
import { User } from "../cti-root-findone/entity/User"
import { Organization } from "../cti-root-findone/entity/Organization"
import { Authorization } from "../cti-root-findone/entity/Authorization"
import { Profile } from "../cti-root-findone/entity/Profile"

/**
 * Tests for CTI root entity query optimization:
 *
 * Bug #5 — Discriminator value should be hydrated onto the entity property.
 * Bug #6 — Root entity queries should NOT LEFT JOIN child tables; only
 *           root-table data (+ root-level relations) should be returned.
 *
 * Design principle (SQLAlchemy approach): Actor is Actor. It has id, type,
 * nameID, authorization, profile. If you need email, query User directly.
 * The parent table is not an umbrella — it's a standalone entity.
 */
describe("class-table-inheritance > cti-root-query-optimization", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [
                    Actor,
                    User,
                    Organization,
                    Authorization,
                    Profile,
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // =========================================================================
    // Bug #5: Discriminator value hydration
    // =========================================================================

    it("should hydrate the discriminator 'type' property on entities loaded via root repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const auth = new Authorization()
                auth.credentialRules = "rule1"
                await connection.getRepository(Authorization).save(auth)

                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                user.authorization = auth
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.nameID = "acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                // Load via root Actor repository
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { nameID: "ASC" } })

                expect(actors).to.have.length(2)

                // Each actor should have the discriminator value hydrated
                // nameID ASC: "acme" < "alice", so org is first
                const loadedOrg = actors[0]
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect((loadedOrg as any).type).to.equal("organization")

                const loadedUser = actors[1]
                expect(loadedUser).to.be.instanceOf(User)
                expect((loadedUser as any).type).to.equal("user")
            }),
        ))

    it("should hydrate discriminator on findOne via root repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.nameID = "bob"
                user.email = "bob@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: user.id } })

                expect(loaded).to.not.be.null
                expect(loaded).to.be.instanceOf(User)
                expect((loaded as any).type).to.equal("user")
            }),
        ))

    it("should hydrate discriminator when loading via child repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.nameID = "charlie"
                user.email = "charlie@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect((loaded as any).type).to.equal("user")
            }),
        ))

    // =========================================================================
    // Bug #6: Root entity queries should NOT include child-specific data
    // =========================================================================

    it("should return only root-table columns when querying via root Actor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.nameID = "acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { nameID: "ASC" } })

                expect(actors).to.have.length(2)

                // Root-table columns should be populated
                // nameID ASC: "acme" < "alice", so org is first
                const loadedOrg = actors[0] as Organization
                expect(loadedOrg.nameID).to.equal("acme")
                expect(loadedOrg.id).to.not.be.undefined
                // Child-specific columns should NOT be populated
                expect(loadedOrg.industry).to.be.undefined

                const loadedUser = actors[1] as User
                expect(loadedUser.nameID).to.equal("alice")
                expect(loadedUser.email).to.be.undefined
            }),
        ))

    it("should return only root-table columns on findOne via root repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: user.id } })

                expect(loaded).to.not.be.null
                expect(loaded).to.be.instanceOf(User)
                expect(loaded!.nameID).to.equal("alice")
                // Child-specific column not populated
                expect((loaded as User).email).to.be.undefined
            }),
        ))

    it("should load root-level eager relations but not child-specific relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const auth = new Authorization()
                auth.credentialRules = "allow-all"
                await connection.getRepository(Authorization).save(auth)

                const profile = new Profile()
                profile.displayName = "Alice's Profile"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                user.authorization = auth
                user.profile = profile
                await connection.getRepository(User).save(user)

                // Query via root — eager relation (authorization) should load
                const loaded = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: user.id } })

                expect(loaded).to.not.be.null
                expect(loaded!.authorization).to.not.be.undefined
                expect(loaded!.authorization).to.not.be.null
                expect(loaded!.authorization.credentialRules).to.equal(
                    "allow-all",
                )

                // Non-eager relation (profile) should not be loaded
                // (it requires explicit join or relations option)
                expect(loaded!.profile).to.be.undefined
            }),
        ))

    it("should return only root-table data via QueryBuilder on root entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.nameID = "acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .createQueryBuilder("actor")
                    .orderBy("actor.nameID", "ASC")
                    .getMany()

                expect(actors).to.have.length(2)

                // nameID ASC: "acme" < "alice", so org is first
                expect(actors[0]).to.be.instanceOf(Organization)
                expect(actors[0].nameID).to.equal("acme")
                expect((actors[0] as Organization).industry).to.be.undefined

                expect(actors[1]).to.be.instanceOf(User)
                expect(actors[1].nameID).to.equal("alice")
                expect((actors[1] as User).email).to.be.undefined
            }),
        ))

    // =========================================================================
    // Child entity queries should still work correctly (regression check)
    // =========================================================================

    it("should return all columns (root + child) when querying via child User repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const auth = new Authorization()
                auth.credentialRules = "rule1"
                await connection.getRepository(Authorization).save(auth)

                const profile = new Profile()
                profile.displayName = "Alice's Profile"
                await connection.getRepository(Profile).save(profile)

                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                user.authorization = auth
                user.profile = profile
                await connection.getRepository(User).save(user)

                // Query via child repository — should INNER JOIN parent table
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.nameID).to.equal("alice")
                expect(loaded!.email).to.equal("alice@example.com")
                expect((loaded as any).type).to.equal("user")
            }),
        ))

    it("should return all columns when querying child Organization repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.nameID = "acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })

                expect(loaded).to.not.be.null
                expect(loaded!.nameID).to.equal("acme")
                expect(loaded!.industry).to.equal("Tech")
                expect((loaded as any).type).to.equal("organization")
            }),
        ))

    it("should not cross-contaminate child data between different child types", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.nameID = "alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.nameID = "acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                // Load User via its repo — should not have organization columns
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loadedUser).to.not.be.null
                expect(loadedUser!.email).to.equal("alice@example.com")
                expect("industry" in loadedUser!).to.be.false

                // Load Organization via its repo — should not have user columns
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(loadedOrg).to.not.be.null
                expect(loadedOrg!.industry).to.equal("Tech")
                expect("email" in loadedOrg!).to.be.false
            }),
        ))
})
