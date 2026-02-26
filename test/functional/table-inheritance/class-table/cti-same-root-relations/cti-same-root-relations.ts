import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { Account } from "./entity/Account"
import { Space } from "./entity/Space"
import { VirtualContributor } from "./entity/VirtualContributor"
import { Authorization } from "./entity/Authorization"
import { expect } from "chai"

/**
 * Bug #3: When a CTI child entity has relations to OTHER CTI child entities
 * that share the SAME root ancestor, the SELECT query references __cti_parent
 * aliases for the nested entities but may fail to add the corresponding JOINs.
 *
 * This test models the Alkemio server pattern:
 *   Actor (root) → Account, Space, VirtualContributor (all children of Actor)
 *   Account has OneToMany → Space, VirtualContributor
 */
describe("table-inheritance > class-table > cti-same-root-relations", () => {
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
    // (a) Account eagerly loads Space (sibling CTI child from same root)
    // =========================================================================

    it("should eagerly load sibling CTI child (Space) from Account via findOneBy", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.name = "Innovation Space"
                space.visibility = "public"
                await connection.getRepository(Space).save(space)

                const account = new Account()
                account.name = "Acme Account"
                account.plan = "premium"
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.plan).to.equal("premium")
                expect(loaded!.name).to.equal("Acme Account")
                expect(loaded!.spaces).to.not.be.undefined
                expect(loaded!.spaces).to.be.an("array")
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].name).to.equal("Innovation Space")
                expect(loaded!.spaces[0].visibility).to.equal("public")
                // Inherited columns should be loaded
                expect(loaded!.spaces[0].createdDate).to.not.be.null
            }),
        ))

    // =========================================================================
    // (b) Account eagerly loads VirtualContributor (another sibling)
    // =========================================================================

    it("should eagerly load sibling CTI child (VirtualContributor) from Account", () =>
        Promise.all(
            connections.map(async (connection) => {
                const vc = new VirtualContributor()
                vc.name = "AI Assistant"
                vc.engine = "gpt-4"
                await connection.getRepository(VirtualContributor).save(vc)

                const account = new Account()
                account.name = "Dev Account"
                account.plan = "basic"
                account.virtualContributors = [vc]
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.virtualContributors).to.have.length(1)
                expect(loaded!.virtualContributors[0].name).to.equal(
                    "AI Assistant",
                )
                expect(loaded!.virtualContributors[0].engine).to.equal("gpt-4")
            }),
        ))

    // =========================================================================
    // (c) Account loads BOTH Space and VirtualContributor simultaneously
    // =========================================================================

    it("should eagerly load multiple sibling CTI children simultaneously", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.name = "Dev Space"
                space.visibility = "private"
                await connection.getRepository(Space).save(space)

                const vc = new VirtualContributor()
                vc.name = "Bot"
                vc.engine = "claude"
                await connection.getRepository(VirtualContributor).save(vc)

                const account = new Account()
                account.name = "Full Account"
                account.plan = "enterprise"
                account.spaces = [space]
                account.virtualContributors = [vc]
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].name).to.equal("Dev Space")
                expect(loaded!.virtualContributors).to.have.length(1)
                expect(loaded!.virtualContributors[0].name).to.equal("Bot")
            }),
        ))

    // =========================================================================
    // (d) findOne with explicit relations
    // =========================================================================

    it("should load sibling CTI children via findOne with explicit relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.name = "Explicit Space"
                space.visibility = "public"
                await connection.getRepository(Space).save(space)

                const account = new Account()
                account.name = "Explicit Account"
                account.plan = "basic"
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                const loaded = await connection.getRepository(Account).findOne({
                    where: { id: account.id },
                    relations: { spaces: true, virtualContributors: true },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].name).to.equal("Explicit Space")
                expect(loaded!.virtualContributors).to.have.length(0)
            }),
        ))

    // =========================================================================
    // (e) QueryBuilder with left join
    // =========================================================================

    it("should load sibling CTI children via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.name = "QB Space"
                space.visibility = "public"
                await connection.getRepository(Space).save(space)

                const account = new Account()
                account.name = "QB Account"
                account.plan = "premium"
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .createQueryBuilder("account")
                    .leftJoinAndSelect("account.spaces", "space")
                    .where("account.id = :id", { id: account.id })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].name).to.equal("QB Space")
            }),
        ))

    // =========================================================================
    // (f) Polymorphic: load from parent Actor repo
    // =========================================================================

    it("should load Account with sibling relations from parent Actor repo", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.name = "Poly Space"
                space.visibility = "public"
                await connection.getRepository(Space).save(space)

                const account = new Account()
                account.name = "Poly Account"
                account.plan = "basic"
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                // Space + Account = 2 actors
                // But Space is eagerly loaded as a relation, not as a standalone actor
                // Actually both Space and Account are saved as actors in the actor table
                expect(actors.length).to.be.greaterThanOrEqual(2)

                const loadedAccount = actors.find(
                    (a) => a instanceof Account,
                ) as Account
                expect(loadedAccount).to.not.be.undefined
                expect(loadedAccount.spaces).to.not.be.undefined
            }),
        ))

    // =========================================================================
    // (g) Multiple spaces, no cross-contamination
    // =========================================================================

    it("should not cross-contaminate sibling CTI relations between accounts", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space1 = new Space()
                space1.name = "Space Alpha"
                space1.visibility = "public"
                await connection.getRepository(Space).save(space1)

                const space2 = new Space()
                space2.name = "Space Beta"
                space2.visibility = "private"
                await connection.getRepository(Space).save(space2)

                const account1 = new Account()
                account1.name = "Account Alpha"
                account1.plan = "premium"
                account1.spaces = [space1]
                await connection.getRepository(Account).save(account1)

                const account2 = new Account()
                account2.name = "Account Beta"
                account2.plan = "basic"
                account2.spaces = [space2]
                await connection.getRepository(Account).save(account2)

                const loaded1 = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account1.id })
                expect(loaded1!.spaces).to.have.length(1)
                expect(loaded1!.spaces[0].name).to.equal("Space Alpha")

                const loaded2 = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account2.id })
                expect(loaded2!.spaces).to.have.length(1)
                expect(loaded2!.spaces[0].name).to.equal("Space Beta")
            }),
        ))

    // =========================================================================
    // (h) CRITICAL: inherited relation on nested CTI child — JOIN ordering
    //     This is the exact Bug #3 pattern: Actor defines a OneToOne to
    //     Authorization. Space inherits this relation. When Account eagerly
    //     loads Spaces, the Space's authorization JOIN references the
    //     __cti_parent alias. If CTI parent JOINs come AFTER the authorization
    //     JOIN, PostgreSQL fails with "missing FROM-clause entry".
    // =========================================================================

    it("should load inherited relation on nested CTI sibling (authorization on Space via Actor)", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create authorization for the space
                const spaceAuth = new Authorization()
                spaceAuth.credentialRules = "space-rules"
                await connection.getRepository(Authorization).save(spaceAuth)

                const space = new Space()
                space.name = "Auth Space"
                space.visibility = "public"
                space.authorization = spaceAuth
                await connection.getRepository(Space).save(space)

                // Create authorization for the account
                const accountAuth = new Authorization()
                accountAuth.credentialRules = "account-rules"
                await connection
                    .getRepository(Authorization)
                    .save(accountAuth)

                const account = new Account()
                account.name = "Auth Account"
                account.plan = "premium"
                account.authorization = accountAuth
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                // Load Account — this triggers the bug:
                // Space's authorization relation references __cti_parent alias
                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.plan).to.equal("premium")

                // Account's own inherited authorization
                expect(loaded!.authorization).to.not.be.null
                expect(loaded!.authorization.credentialRules).to.equal(
                    "account-rules",
                )

                // Space's inherited authorization (from Actor → Authorization)
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].name).to.equal("Auth Space")
                expect(loaded!.spaces[0].authorization).to.not.be.null
                expect(
                    loaded!.spaces[0].authorization.credentialRules,
                ).to.equal("space-rules")
            }),
        ))

    // =========================================================================
    // (i) Both Space and VirtualContributor with inherited authorization
    // =========================================================================

    it("should load inherited relations on multiple nested CTI siblings simultaneously", () =>
        Promise.all(
            connections.map(async (connection) => {
                const spaceAuth = new Authorization()
                spaceAuth.credentialRules = "space-auth"
                await connection.getRepository(Authorization).save(spaceAuth)

                const space = new Space()
                space.name = "Multi Space"
                space.visibility = "public"
                space.authorization = spaceAuth
                await connection.getRepository(Space).save(space)

                const vcAuth = new Authorization()
                vcAuth.credentialRules = "vc-auth"
                await connection.getRepository(Authorization).save(vcAuth)

                const vc = new VirtualContributor()
                vc.name = "Multi Bot"
                vc.engine = "claude"
                vc.authorization = vcAuth
                await connection.getRepository(VirtualContributor).save(vc)

                const accountAuth = new Authorization()
                accountAuth.credentialRules = "account-auth"
                await connection
                    .getRepository(Authorization)
                    .save(accountAuth)

                const account = new Account()
                account.name = "Multi Account"
                account.plan = "enterprise"
                account.authorization = accountAuth
                account.spaces = [space]
                account.virtualContributors = [vc]
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null

                // Account's authorization
                expect(loaded!.authorization.credentialRules).to.equal(
                    "account-auth",
                )

                // Space's inherited authorization
                expect(loaded!.spaces).to.have.length(1)
                expect(
                    loaded!.spaces[0].authorization.credentialRules,
                ).to.equal("space-auth")

                // VirtualContributor's inherited authorization
                expect(loaded!.virtualContributors).to.have.length(1)
                expect(
                    loaded!.virtualContributors[0].authorization
                        .credentialRules,
                ).to.equal("vc-auth")
            }),
        ))
})
