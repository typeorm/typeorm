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
import { AuthorizationPolicy } from "./entity/AuthorizationPolicy"
import { Profile } from "./entity/Profile"
import { Credential } from "./entity/Credential"
import { expect } from "chai"
import { In } from "../../../../../src"

/**
 * Tests for CTI root entities that extend 3 levels of abstract base classes,
 * each adding TypeORM decorators — matching the Alkemio production pattern.
 *
 * Inheritance chain:
 *   BaseEntity (TypeORM Active Record) →
 *     BaseAlkemioEntity (uuid PK, @CreateDateColumn, @UpdateDateColumn, @VersionColumn) →
 *       AuthorizableEntity (@OneToOne Authorization, eager: true) →
 *         NameableEntity (@Column nameID, @OneToOne Profile, eager: false) →
 *           Actor (@Entity CTI root, @OneToMany Credential) →
 *             User / Organization (@ChildEntity)
 *
 * Bug #4: When querying the CTI root entity directly via findOne/find, columns
 * inherited from abstract base classes (id, createdDate, updatedDate, version)
 * were not hydrated because the transformer used column.target reference checks
 * that failed for abstract class targets not in the CTI ancestor chain.
 */
describe("table-inheritance > class-table > base-entity-chain", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // Helper: insert a User with authorization, profile, and credentials
    async function insertUser(
        connection: DataSource,
        nameID: string,
        email: string,
    ): Promise<User> {
        const auth = new AuthorizationPolicy()
        auth.credentialRules = "user-rules"
        const profile = new Profile()
        profile.displayName = nameID

        const cred = new Credential()
        cred.type = "UserSelfManagement"
        cred.resourceID = ""

        const user = new User()
        user.nameID = nameID
        user.email = email
        user.authorization = auth
        user.profile = profile
        user.credentials = [cred]
        return connection.getRepository(User).save(user)
    }

    // Helper: insert an Organization
    async function insertOrg(
        connection: DataSource,
        nameID: string,
        industry: string,
    ): Promise<Organization> {
        const auth = new AuthorizationPolicy()
        auth.credentialRules = "org-rules"
        const profile = new Profile()
        profile.displayName = nameID

        const org = new Organization()
        org.nameID = nameID
        org.industry = industry
        org.authorization = auth
        org.profile = profile
        org.credentials = []
        return connection.getRepository(Organization).save(org)
    }

    // ===================================================================
    // (A) Root entity findOne with where clause
    // ===================================================================
    it("(A) should return correct child type via Repository.findOne(Actor, { where })", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: saved.id } })

                expect(actor).to.not.be.null
                expect(actor!.id).to.equal(saved.id)
                expect(actor).to.be.instanceOf(User)
                // Root-table columns are populated
                expect(actor!.nameID).to.equal("alice")
                expect(actor!.version).to.equal(1)
                expect(actor!.createdDate).to.be.instanceOf(Date)
                expect(actor!.updatedDate).to.be.instanceOf(Date)
                // Child-specific columns are undefined from parent repo query
                expect((actor as User).email).to.be.undefined

                // Verify child data by querying child entity directly
                const user = await connection
                    .getRepository(User)
                    .findOne({ where: { id: saved.id } })
                expect(user).to.not.be.null
                expect(user!.email).to.equal("alice@test.com")
            }),
        ))

    // ===================================================================
    // (B) Root entity findOne with partial select + loadEagerRelations: false
    //     With partial select the discriminator column may not be in the
    //     SELECT list, so TypeORM returns an Actor (the root class) rather
    //     than the concrete child. The id is still correctly hydrated.
    // ===================================================================
    it("(B) should return entity with id via partial select + loadEagerRelations: false", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection
                    .getRepository(Actor)
                    .findOne({
                        where: { id: saved.id },
                        select: { id: true },
                        loadEagerRelations: false,
                    })

                expect(actor).to.not.be.null
                expect(actor!.id).to.equal(saved.id)
            }),
        ))

    // ===================================================================
    // (C) Root entity findOne with explicit relations option
    // ===================================================================
    it("(C) should load authorization via findOne with relations: { authorization: true }", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection
                    .getRepository(Actor)
                    .findOne({
                        where: { id: saved.id },
                        relations: { authorization: true },
                    })

                expect(actor).to.not.be.null
                expect(actor!.id).to.equal(saved.id)
                expect(actor!.authorization).to.not.be.undefined
                expect(actor!.authorization.credentialRules).to.equal(
                    "user-rules",
                )
            }),
        ))

    // ===================================================================
    // (D) Root entity count
    // ===================================================================
    it("(D) should return correct count via Repository.count(Actor)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const count = await connection
                    .getRepository(Actor)
                    .count({ where: { id: saved.id } })

                expect(count).to.equal(1)
            }),
        ))

    // ===================================================================
    // (E) Root entity find with select + loadEagerRelations: false + In()
    //     With partial select the discriminator may not be available, so
    //     entities come back as Actor. We verify ids are correctly hydrated.
    // ===================================================================
    it("(E) should return entities with ids via find with select + In() + loadEagerRelations: false", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )
                const org = await insertOrg(connection, "acme", "Tech")

                const actors = await connection
                    .getRepository(Actor)
                    .find({
                        where: { id: In([user.id, org.id]) },
                        select: { id: true },
                        loadEagerRelations: false,
                    })

                expect(actors).to.have.length(2)
                const ids = actors.map((a) => a.id).sort()
                expect(ids).to.deep.equal([user.id, org.id].sort())
            }),
        ))

    // ===================================================================
    // (F) Root entity with eager relation auto-loaded
    // ===================================================================
    it("(F) should auto-load eager authorization relation on findOne without explicit relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: saved.id } })

                expect(actor).to.not.be.null
                // eager: true should auto-load authorization
                expect(actor!.authorization).to.not.be.undefined
                expect(actor!.authorization.id).to.be.a("string")
                expect(actor!.authorization.credentialRules).to.equal(
                    "user-rules",
                )
            }),
        ))

    // ===================================================================
    // (G) EntityManager.findOne vs Repository.findOne (same behavior)
    // ===================================================================
    it("(G) should return same result via EntityManager.findOne as Repository.findOne", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const viaRepo = await connection
                    .getRepository(Actor)
                    .findOne({ where: { id: saved.id } })

                const viaEm = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                })

                expect(viaRepo).to.not.be.null
                expect(viaEm).to.not.be.null

                // Both should return the same data
                expect(viaRepo!.id).to.equal(viaEm!.id)
                expect(viaRepo!.id).to.equal(saved.id)
                expect(viaRepo!.nameID).to.equal(viaEm!.nameID)
                expect(viaRepo!.version).to.equal(viaEm!.version)
                expect(viaRepo!.constructor.name).to.equal(
                    viaEm!.constructor.name,
                )
                expect(viaRepo).to.be.instanceOf(User)
                expect(viaEm).to.be.instanceOf(User)
                expect((viaRepo as User).email).to.equal(
                    (viaEm as User).email,
                )
            }),
        ))

    // ===================================================================
    // (H) EntityManager.count on root entity
    // ===================================================================
    it("(H) should return correct count via EntityManager.count(Actor)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const count = await connection.manager.count(Actor, {
                    where: { id: saved.id },
                })

                expect(count).to.equal(1)
            }),
        ))

    // ===================================================================
    // (I) Credentials (OneToMany on CTI root) loaded via relations
    // ===================================================================
    it("(I) should load credentials OneToMany relation on CTI root via findOne", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                    relations: { credentials: true },
                })

                expect(actor).to.not.be.null
                expect(actor!.credentials).to.be.an("array")
                expect(actor!.credentials).to.have.length(1)
                expect(actor!.credentials[0].type).to.equal(
                    "UserSelfManagement",
                )
            }),
        ))

    // ===================================================================
    // (J) Non-eager profile loaded via explicit relations
    // ===================================================================
    it("(J) should load non-eager profile relation when explicitly requested", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                    relations: { profile: true },
                })

                expect(actor).to.not.be.null
                expect(actor!.profile).to.not.be.undefined
                expect(actor!.profile.displayName).to.equal("alice")
            }),
        ))

    // ===================================================================
    // (K) Mixed child types from parent repository
    // ===================================================================
    it("(K) should return correct child types when querying parent repository with find()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const savedAlice = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )
                await insertUser(connection, "bob", "bob@test.com")
                const savedAcme = await insertOrg(connection, "acme", "Tech")

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { nameID: "ASC" } })

                expect(actors).to.have.length(3)

                // "acme" < "alice" < "bob"
                expect(actors[0]).to.be.instanceOf(Organization)
                expect(actors[0].nameID).to.equal("acme")
                // Child-specific columns are undefined from parent repo query
                expect((actors[0] as Organization).industry).to.be.undefined

                expect(actors[1]).to.be.instanceOf(User)
                expect(actors[1].nameID).to.equal("alice")
                // Child-specific columns are undefined from parent repo query
                expect((actors[1] as User).email).to.be.undefined

                expect(actors[2]).to.be.instanceOf(User)
                expect(actors[2].nameID).to.equal("bob")

                // All should have id, version, timestamps hydrated (root-table columns)
                for (const actor of actors) {
                    expect(actor.id).to.be.a("string")
                    expect(actor.version).to.equal(1)
                    expect(actor.createdDate).to.be.instanceOf(Date)
                    expect(actor.updatedDate).to.be.instanceOf(Date)
                }

                // Verify child-specific data by querying child entities directly
                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOne({ where: { id: savedAcme.id } })
                expect(fullOrg!.industry).to.equal("Tech")

                const fullAlice = await connection
                    .getRepository(User)
                    .findOne({ where: { id: savedAlice.id } })
                expect(fullAlice!.email).to.equal("alice@test.com")
            }),
        ))

    // ===================================================================
    // (L) findOneBy on root entity (different code path from findOne)
    // ===================================================================
    it("(L) should work via Repository.findOneBy on root entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection
                    .getRepository(Actor)
                    .findOneBy({ id: saved.id })

                expect(actor).to.not.be.null
                expect(actor!.id).to.equal(saved.id)
                expect(actor).to.be.instanceOf(User)
                // Root-table columns are populated
                expect(actor!.version).to.equal(1)
                // Child-specific columns are undefined from parent repo query
                expect((actor as User).email).to.be.undefined

                // Verify child data by querying child entity directly
                const user = await connection
                    .getRepository(User)
                    .findOneBy({ id: saved.id })
                expect(user).to.not.be.null
                expect(user!.email).to.equal("alice@test.com")
            }),
        ))

    // ===================================================================
    // (M) Root findOne with credentials relation + select + loadEagerRelations: false
    // ===================================================================
    it("(M) should load credentials with select + loadEagerRelations: false", () =>
        Promise.all(
            connections.map(async (connection) => {
                const saved = await insertUser(
                    connection,
                    "alice",
                    "alice@test.com",
                )

                const actor = await connection.manager.findOne(Actor, {
                    where: { id: saved.id },
                    relations: { credentials: true },
                    select: { id: true },
                    loadEagerRelations: false,
                })

                expect(actor).to.not.be.null
                expect(actor!.id).to.equal(saved.id)
                expect(actor!.credentials).to.be.an("array")
                expect(actor!.credentials).to.have.length(1)
            }),
        ))

    // ===================================================================
    // (N) loadEagerRelations: false suppresses eager loading
    // ===================================================================
    it("(N) should suppress eager authorization when loadEagerRelations: false", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@test.com")

                const actors = await connection
                    .getRepository(Actor)
                    .find({ loadEagerRelations: false })

                expect(actors).to.have.length(1)
                // eager: true on authorization should be suppressed
                expect(actors[0].authorization).to.be.undefined
            }),
        ))

    // ===================================================================
    // (O) Root find with nested credentials where clause
    // ===================================================================
    it("(O) should find actors filtered by nested credentials where", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@test.com")
                await insertOrg(connection, "acme", "Tech")

                const actors = await connection.manager.find(Actor, {
                    where: {
                        credentials: {
                            type: "UserSelfManagement",
                        },
                    },
                    relations: { credentials: true },
                })

                // Only the user has credentials with this type
                expect(actors).to.have.length(1)
                expect(actors[0]).to.be.instanceOf(User)
            }),
        ))

    // ===================================================================
    // (P) Root count with nested credentials where
    // ===================================================================
    it("(P) should count actors filtered by nested credentials where", () =>
        Promise.all(
            connections.map(async (connection) => {
                await insertUser(connection, "alice", "alice@test.com")
                await insertOrg(connection, "acme", "Tech")

                const count = await connection.manager.count(Actor, {
                    where: {
                        credentials: {
                            type: "UserSelfManagement",
                        },
                    },
                })

                expect(count).to.equal(1)
            }),
        ))
})
