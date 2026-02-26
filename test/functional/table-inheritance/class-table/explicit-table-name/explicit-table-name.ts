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

describe("table-inheritance > class-table > explicit-table-name", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create tables with explicit custom names", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Parent table should still be "actor"
                const actorTable = await queryRunner.getTable("actor")
                expect(actorTable).to.not.be.undefined

                // User table should be "app_users" (not "user")
                const userTable = await queryRunner.getTable("app_users")
                expect(userTable).to.not.be.undefined
                const userCols = userTable!.columns.map((c) => c.name)
                expect(userCols).to.include("id")
                expect(userCols).to.include("email")

                // Organization table should be "app_organizations" (not "organization")
                const orgTable =
                    await queryRunner.getTable("app_organizations")
                expect(orgTable).to.not.be.undefined
                const orgCols = orgTable!.columns.map((c) => c.name)
                expect(orgCols).to.include("id")
                expect(orgCols).to.include("industry")

                // Default-named tables should NOT exist
                const defaultUser = await queryRunner.getTable("user")
                expect(defaultUser).to.be.undefined
                const defaultOrg =
                    await queryRunner.getTable("organization")
                expect(defaultOrg).to.be.undefined

                await queryRunner.release()
            }),
        ))

    it("should insert and read entities using custom table names", () =>
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

                const loadedUsers = await connection
                    .getRepository(User)
                    .find()

                expect(loadedUsers).to.have.length(1)
                expect(loadedUsers[0].name).to.equal("Alice")
                expect(loadedUsers[0].email).to.equal("alice@example.com")

                const loadedOrgs = await connection
                    .getRepository(Organization)
                    .find()

                expect(loadedOrgs).to.have.length(1)
                expect(loadedOrgs[0].name).to.equal("Acme")
                expect(loadedOrgs[0].industry).to.equal("Tech")
            }),
        ))

    it("should use custom discriminator value from options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                // Check discriminator value is "Org" (not "Organization")
                const rawResult = await connection
                    .createQueryBuilder()
                    .select("actor.type", "type")
                    .from("actor", "actor")
                    .where("actor.id = :id", { id: org.id })
                    .getRawOne()

                expect(rawResult).to.not.be.undefined
                expect(rawResult!.type).to.equal("Org")
            }),
        ))

    it("should load polymorphically via parent repo with custom table names", () =>
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

                expect(actors).to.have.length(2)
                // Correct child class instances are returned
                expect(actors[0]).to.be.instanceOf(User)
                expect(actors[1]).to.be.instanceOf(Organization)
                // Root-table columns are populated
                expect(actors[0].name).to.equal("Alice")
                expect(actors[1].name).to.equal("Acme")
                // Child-specific columns are undefined from parent repo query
                expect((actors[0] as User).email).to.be.undefined
                expect((actors[1] as Organization).industry).to.be.undefined

                // Verify child data by querying child entities directly
                const fullUser = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })
                expect(fullUser!.email).to.equal("alice@example.com")

                const fullOrg = await connection
                    .getRepository(Organization)
                    .findOneBy({ id: org.id })
                expect(fullOrg!.industry).to.equal("Tech")
            }),
        ))
})
