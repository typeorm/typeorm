import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Actor } from "./entity/Actor"
import { Account } from "./entity/Account"
import { Resource } from "./entity/Resource"
import { Space } from "./entity/Space"
import { Document } from "./entity/Document"
import { expect } from "chai"

describe("table-inheritance > class-table > cti-relation-to-cti", () => {
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
    // (a) Basic: CTI child (Account) has eager relation to another CTI child (Space)
    //     This is the pattern that triggers Bug #3: the SELECT adds
    //     __cti_parent aliases for Space but the INNER JOIN is missing.
    // =========================================================================

    it("should eagerly load CTI child relation (Space) from CTI child (Account)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.title = "Innovation Space"
                space.visibility = "public"
                await connection.getRepository(Space).save(space)

                const account = new Account()
                account.name = "Acme Account"
                account.plan = "premium"
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                // Load Account — should eagerly load Space
                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.plan).to.equal("premium")
                expect(loaded!.spaces).to.not.be.undefined
                expect(loaded!.spaces).to.be.an("array")
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].title).to.equal("Innovation Space")
                expect(loaded!.spaces[0].visibility).to.equal("public")
            }),
        ))

    // =========================================================================
    // (b) Load via findOne with explicit relations
    // =========================================================================

    it("should load CTI-to-CTI relations via findOne with explicit relations option", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.title = "Dev Space"
                space.visibility = "private"
                await connection.getRepository(Space).save(space)

                const account = new Account()
                account.name = "Dev Account"
                account.plan = "basic"
                account.spaces = [space]
                await connection.getRepository(Account).save(account)

                const loaded = await connection.getRepository(Account).findOne({
                    where: { id: account.id },
                    relations: { spaces: true },
                })

                expect(loaded).to.not.be.null
                expect(loaded!.spaces).to.have.length(1)
                expect(loaded!.spaces[0].title).to.equal("Dev Space")
            }),
        ))

    // =========================================================================
    // (c) Multiple spaces on one account
    // =========================================================================

    it("should handle multiple CTI child relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space1 = new Space()
                space1.title = "Space One"
                space1.visibility = "public"
                await connection.getRepository(Space).save(space1)

                const space2 = new Space()
                space2.title = "Space Two"
                space2.visibility = "private"
                await connection.getRepository(Space).save(space2)

                const space3 = new Space()
                space3.title = "Space Three"
                space3.visibility = "public"
                await connection.getRepository(Space).save(space3)

                const account = new Account()
                account.name = "Multi Account"
                account.plan = "enterprise"
                account.spaces = [space1, space2, space3]
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.spaces).to.have.length(3)

                const titles = loaded!.spaces.map((s) => s.title).sort()
                expect(titles).to.deep.equal([
                    "Space One",
                    "Space Three",
                    "Space Two",
                ])
            }),
        ))

    // =========================================================================
    // (d) Polymorphic query: load from parent Actor repo, Account gets spaces
    // =========================================================================

    it("should eagerly load CTI-to-CTI relation when querying from parent Actor repo", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.title = "Poly Space"
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

                // Should have one Account (Space is a Resource, not an Actor)
                expect(actors).to.have.length(1)
                expect(actors[0]).to.be.instanceOf(Account)

                const loadedAccount = actors[0] as Account
                // Child-specific columns are undefined from parent repo query
                expect(loadedAccount.plan).to.be.undefined
                // Child-specific eager relations are not loaded from parent repo query
                expect(loadedAccount.spaces).to.be.undefined

                // Query child entity directly to verify full data
                const fullAccount = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })
                expect(fullAccount).to.not.be.null
                expect(fullAccount!.plan).to.equal("basic")
                expect(fullAccount!.spaces).to.not.be.undefined
                expect(fullAccount!.spaces).to.be.an("array")
                expect(fullAccount!.spaces).to.have.length(1)
                expect(fullAccount!.spaces[0].title).to.equal("Poly Space")
            }),
        ))

    // =========================================================================
    // (e) QueryBuilder: load Account with spaces
    // =========================================================================

    it("should load CTI-to-CTI relations via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space = new Space()
                space.title = "QB Space"
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
                expect(loaded!.spaces[0].title).to.equal("QB Space")
                expect(loaded!.spaces[0].visibility).to.equal("public")
            }),
        ))

    // =========================================================================
    // (f) Both CTI hierarchies exist independently
    // =========================================================================

    it("should handle two independent CTI hierarchies", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Actor hierarchy: Account
                const account = new Account()
                account.name = "Acme Account"
                account.plan = "basic"
                await connection.getRepository(Account).save(account)

                // Resource hierarchy: Space and Document
                const space = new Space()
                space.title = "Test Space"
                space.visibility = "public"
                space.account = account
                await connection.getRepository(Space).save(space)

                const doc = new Document()
                doc.title = "Test Document"
                doc.content = "Hello World"
                await connection.getRepository(Document).save(doc)

                // Query Resource hierarchy — parent repo returns correct child types
                // but only root-table columns are populated
                const resources = await connection
                    .getRepository(Resource)
                    .find({ order: { id: "ASC" } })

                expect(resources).to.have.length(2)
                expect(resources[0]).to.be.instanceOf(Space)
                expect(resources[1]).to.be.instanceOf(Document)
                // Root-table column (title) is populated
                expect(resources[0].title).to.equal("Test Space")
                expect(resources[1].title).to.equal("Test Document")
                // Child-specific columns are undefined from parent repo query
                expect((resources[0] as Space).visibility).to.be.undefined
                expect((resources[1] as Document).content).to.be.undefined

                // Verify child data by querying child entities directly
                const fullSpace = await connection
                    .getRepository(Space)
                    .findOneBy({ id: space.id })
                expect(fullSpace!.visibility).to.equal("public")

                const fullDoc = await connection
                    .getRepository(Document)
                    .findOneBy({ id: doc.id })
                expect(fullDoc!.content).to.equal("Hello World")

                // Query Actor hierarchy
                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(1)
                expect(actors[0]).to.be.instanceOf(Account)
            }),
        ))

    // =========================================================================
    // (g) Empty relation: Account with no spaces
    // =========================================================================

    it("should handle CTI-to-CTI relation with no related entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const account = new Account()
                account.name = "Empty Account"
                account.plan = "basic"
                await connection.getRepository(Account).save(account)

                const loaded = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account.id })

                expect(loaded).to.not.be.null
                expect(loaded!.spaces).to.not.be.undefined
                expect(loaded!.spaces).to.be.an("array")
                expect(loaded!.spaces).to.have.length(0)
            }),
        ))

    // =========================================================================
    // (h) Multiple accounts with different spaces — no cross-contamination
    // =========================================================================

    it("should not cross-contaminate CTI-to-CTI relations between accounts", () =>
        Promise.all(
            connections.map(async (connection) => {
                const space1 = new Space()
                space1.title = "Alpha Space"
                space1.visibility = "public"
                await connection.getRepository(Space).save(space1)

                const space2 = new Space()
                space2.title = "Beta Space"
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
                expect(loaded1!.spaces[0].title).to.equal("Alpha Space")

                const loaded2 = await connection
                    .getRepository(Account)
                    .findOneBy({ id: account2.id })
                expect(loaded2!.spaces).to.have.length(1)
                expect(loaded2!.spaces[0].title).to.equal("Beta Space")
            }),
        ))
})
