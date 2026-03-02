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

/**
 * Column overloading in CTI: when a child entity re-declares a column that
 * already exists on the parent, TypeORM treats it as the SAME inherited column.
 * The column physically lives on the parent table only — it does NOT create a
 * duplicate column on the child table. The child's @Column decorator metadata
 * (e.g., default value) is effectively ignored; the parent's definition wins.
 *
 * This behavior differs from some ORMs where the child can "shadow" a parent
 * column with its own physical column on the child table.
 */
describe("table-inheritance > class-table > column-overloading", () => {
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
    // (a) Schema: redeclared column lives on parent table, NOT on child table
    // =========================================================================

    it("should keep redeclared column on parent table only (no duplication on child)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qr = connection.createQueryRunner()

                // Parent table should have "color"
                const actorTable = await qr.getTable("actor")
                const actorCols = actorTable!.columns.map((c) => c.name)
                expect(actorCols).to.include("color")

                // User table should NOT have "color" — it's inherited from parent
                const userTable = await qr.getTable("user")
                const userCols = userTable!.columns.map((c) => c.name)
                expect(userCols).to.not.include("color")

                // Organization table should NOT have "color" either
                const orgTable = await qr.getTable("organization")
                const orgCols = orgTable!.columns.map((c) => c.name)
                expect(orgCols).to.not.include("color")

                await qr.release()
            }),
        ))

    // =========================================================================
    // (b) Insert child with redeclared column → value stored in parent table
    // =========================================================================

    it("should store redeclared column value in parent table on insert", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.color = "blue"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                // Parent table should have the color value
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRows[0].color).to.equal("blue")

                // Child table should NOT have a color column
                const userRows = await qr.query(
                    `SELECT * FROM "user" WHERE "id" = ${user.id}`,
                )
                expect(userRows[0].color).to.be.undefined

                await qr.release()
            }),
        ))

    // =========================================================================
    // (c) Insert non-overloading child → same behavior, stored in parent table
    // =========================================================================

    it("should store inherited column in parent table for non-overloading child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.color = "green"
                await connection.getRepository(Organization).save(org)

                const qr = connection.createQueryRunner()

                // Parent table should have the color value
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${org.id}`,
                )
                expect(actorRows[0].color).to.equal("green")

                // Organization table should NOT have color column
                const orgRows = await qr.query(
                    `SELECT * FROM "organization" WHERE "id" = ${org.id}`,
                )
                expect(orgRows[0].color).to.be.undefined

                await qr.release()
            }),
        ))

    // =========================================================================
    // (d) Load child with redeclared column → reads from parent table
    // =========================================================================

    it("should load redeclared column value correctly for overloading child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.color = "red"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded!.color).to.equal("red")
            }),
        ))

    // =========================================================================
    // (e) Load non-overloading child → same behavior
    // =========================================================================

    it("should load inherited column from parent table for non-overloading child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.color = "green"
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })

                expect(loaded!.color).to.equal("green")
            }),
        ))

    // =========================================================================
    // (f) Polymorphic query from parent repo → correct color per entity
    // =========================================================================

    it("should return correct color values in polymorphic parent query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.color = "blue"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.color = "green"
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                // Both get color from parent table
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[0].color).to.equal("blue")

                expect(actors[1]).to.be.instanceOf(Organization)
                expect(actors[1].color).to.equal("green")
            }),
        ))

    // =========================================================================
    // (g) Update redeclared column → updates parent table
    // =========================================================================

    it("should update redeclared column in parent table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.color = "blue"
                await connection.getRepository(User).save(user)

                user.color = "purple"
                await connection.getRepository(User).save(user)

                const qr = connection.createQueryRunner()

                // Parent table should have updated value
                const actorRows = await qr.query(
                    `SELECT * FROM "actor" WHERE "id" = ${user.id}`,
                )
                expect(actorRows[0].color).to.equal("purple")

                await qr.release()

                // Entity should reflect the update
                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loaded!.color).to.equal("purple")
            }),
        ))

    // =========================================================================
    // (h) Default: child's @Column default is ignored, parent's default wins
    // =========================================================================

    it("should use parent's default even when child redeclares with different default", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                // do NOT set color — should use parent's default ("default-color"),
                // not child's default ("user-default-color")
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded!.color).to.equal("default-color")
            }),
        ))

    // =========================================================================
    // (i) Default values: non-overloading child also gets parent's default
    // =========================================================================

    it("should use parent's default for inherited column when no value is set", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                // do NOT set color — should use parent's default
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })

                expect(loaded!.color).to.equal("default-color")
            }),
        ))

    // =========================================================================
    // (j) Mixed: different children don't interfere with each other's values
    // =========================================================================

    it("should independently manage color values for different children", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.color = "red"
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                org.color = "green"
                await connection.getRepository(Organization).save(org)

                // Update user's color
                user.color = "yellow"
                await connection.getRepository(User).save(user)

                // Org's color should be unchanged
                const loadedOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(loadedOrg!.color).to.equal("green")

                // User's color should be updated
                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(loadedUser!.color).to.equal("yellow")
            }),
        ))
})
