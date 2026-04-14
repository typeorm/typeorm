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

describe("table-inheritance > class-table > version-and-update-date", () => {
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
    // (a) INSERT should return version=1 on the entity (RETURNING only parent cols)
    // =========================================================================

    it("should set version=1 on initial insert", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(1)
                expect(user.updateDate).to.not.be.undefined
                expect(user.updateDate).to.not.be.null
            }),
        ))

    // =========================================================================
    // (b) UPDATE parent column only → version should increment
    // =========================================================================

    it("should increment version when updating parent column only", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(1)

                // Update parent column only
                user.name = "Alice Updated"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(2)

                // Verify from DB
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded!.version).to.equal(2)
                expect(loaded!.name).to.equal("Alice Updated")
            }),
        ))

    // =========================================================================
    // (c) UPDATE child column only → version on root should still increment
    //     This was the Bug #2 we fixed: when only child columns change,
    //     the root ancestor must still get an UPDATE for version/updateDate.
    // =========================================================================

    it("should increment version when updating child column only", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(1)

                // Update child column only
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(2)

                // Verify from DB
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded!.version).to.equal(2)
                expect(loaded!.email).to.equal("newalice@example.com")
                expect(loaded!.name).to.equal("Alice") // parent unchanged
            }),
        ))

    // =========================================================================
    // (d) UPDATE both parent + child columns → version increments once
    // =========================================================================

    it("should increment version once when updating both parent and child columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(1)

                user.name = "Alice Updated"
                user.email = "newalice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(2)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded!.version).to.equal(2)
            }),
        ))

    // =========================================================================
    // (e) Multiple sequential updates → version increments correctly
    // =========================================================================

    it("should increment version on each successive update", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.version).to.equal(1)

                user.email = "alice2@example.com"
                await connection.getRepository(User).save(user)
                expect(user.version).to.equal(2)

                user.name = "Alice v3"
                await connection.getRepository(User).save(user)
                expect(user.version).to.equal(3)

                user.email = "alice4@example.com"
                user.name = "Alice v4"
                await connection.getRepository(User).save(user)
                expect(user.version).to.equal(4)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded!.version).to.equal(4)
            }),
        ))

    // =========================================================================
    // (f) version/updateDate live on parent table only (raw data check)
    // =========================================================================

    it("should store version and updateDate in parent table only", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                // Parent table should have version and updateDate
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRows).to.have.length(1)
                expect(actorRows[0].version).to.equal(1)
                expect(actorRows[0].updateDate).to.not.be.null

                // Child table should NOT have version or updateDate columns
                const userTable = await qr.getTable("user")
                const userColNames = userTable!.columns.map((c) => c.name)
                expect(userColNames).to.not.include("version")
                expect(userColNames).to.not.include("updateDate")

                await qr.release()
            }),
        ))

    // =========================================================================
    // (g) version increments for different child types independently
    // =========================================================================

    it("should independently track version for different child entity types", () =>
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

                expect(user.version).to.equal(1)
                expect(org.version).to.equal(1)

                // Update user twice
                user.email = "alice2@example.com"
                await connection.getRepository(User).save(user)

                user.email = "alice3@example.com"
                await connection.getRepository(User).save(user)

                // Update org once
                org.industry = "AI"
                await connection.getRepository(Organization).save(org)

                // User should be at version 3, org at version 2
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loadedUser!.version).to.equal(3)

                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(loadedOrg!.version).to.equal(2)
            }),
        ))

    // =========================================================================
    // (h) INSERT RETURNING should not reference inherited columns on child
    //     This was Bug #1 we fixed: RETURNING clause should only include
    //     columns that physically belong to the child table.
    // =========================================================================

    it("should not fail on insert due to RETURNING inherited columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                // This test verifies the fix for the RETURNING clause bug.
                // Before the fix, INSERT INTO "user" ... RETURNING "version", "updateDate"
                // would fail because version/updateDate live on "actor" table, not "user".
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                // Should succeed without error and have correct values
                expect(user.id).to.be.greaterThan(0)
                expect(user.version).to.equal(1)
                expect(user.name).to.equal("Alice")
                expect(user.email).to.equal("alice@example.com")
            }),
        ))

    // =========================================================================
    // (i) Loading via parent Actor repo should include version/updateDate
    // =========================================================================

    it("should load version and updateDate when querying via parent Actor repository", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                user.email = "alice2@example.com"
                await connection.getRepository(User).save(user)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(1)
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[0].version).to.equal(2)
                expect(actors[0].updateDate).to.not.be.null
            }),
        ))
})
