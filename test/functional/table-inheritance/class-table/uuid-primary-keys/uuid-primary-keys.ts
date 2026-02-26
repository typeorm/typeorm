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

describe("table-inheritance > class-table > uuid-primary-keys", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create tables with UUID primary key columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const actorTable = await queryRunner.getTable("actor")
                expect(actorTable).to.not.be.undefined
                const idCol = actorTable!.columns.find(
                    (c) => c.name === "id",
                )
                expect(idCol).to.not.be.undefined
                // UUID columns are typically "uuid" type in postgres
                expect(idCol!.type).to.equal("uuid")

                const userTable = await queryRunner.getTable("user")
                expect(userTable).to.not.be.undefined
                const userIdCol = userTable!.columns.find(
                    (c) => c.name === "id",
                )
                expect(userIdCol).to.not.be.undefined
                expect(userIdCol!.type).to.equal("uuid")

                await queryRunner.release()
            }),
        ))

    it("should insert and read CTI entities with UUID PKs", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                expect(user.id).to.not.be.undefined
                expect(user.id).to.be.a("string")
                // UUID format: 8-4-4-4-12 hex chars
                expect(user.id).to.match(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                )

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                expect(org.id).to.not.be.undefined
                expect(org.id).to.match(
                    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                )

                // Both should have different UUIDs
                expect(user.id).to.not.equal(org.id)
            }),
        ))

    it("should load UUID-keyed child entities correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.id).to.equal(user.id)
                expect(loaded!.name).to.equal("Alice")
                expect(loaded!.email).to.equal("alice@example.com")
            }),
        ))

    it("should load UUID-keyed entities polymorphically via parent repo", () =>
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
                    .find({ order: { name: "ASC" } })

                expect(actors).to.have.length(2)

                // Correct child class instances are returned; UUIDs are populated
                const loadedOrg = actors[0] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.id).to.equal(org.id)
                // Child-specific columns are undefined from parent repo query
                expect(loadedOrg.industry).to.be.undefined

                const loadedUser = actors[1] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.id).to.equal(user.id)
                // Child-specific columns are undefined from parent repo query
                expect(loadedUser.email).to.be.undefined

                // Verify child data by querying child entities directly
                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(fullOrg!.industry).to.equal("Tech")

                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.email).to.equal("alice@example.com")
            }),
        ))

    it("should find by UUID via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .where("u.id = :id", { id: user.id })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.id).to.equal(user.id)
                expect(loaded!.name).to.equal("Alice")
            }),
        ))
})
