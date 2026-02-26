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

describe("table-inheritance > class-table > abstract-intermediate", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should place abstract intermediate columns on child table (User gets reputation)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const userTable = await queryRunner.getTable("user")
                expect(userTable).to.not.be.undefined
                const userCols = userTable!.columns.map((c) => c.name)
                expect(userCols).to.include("email")
                expect(userCols).to.include("reputation")

                await queryRunner.release()
            }),
        ))

    it("should NOT give abstract intermediate columns to non-extending child (Organization)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const orgTable = await queryRunner.getTable("organization")
                expect(orgTable).to.not.be.undefined
                const orgCols = orgTable!.columns.map((c) => c.name)
                expect(orgCols).to.include("industry")
                expect(orgCols).to.not.include("reputation")

                await queryRunner.release()
            }),
        ))

    it("should NOT create a table for the abstract intermediate class", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const contributorTable =
                    await queryRunner.getTable("contributor")
                expect(contributorTable).to.be.undefined
                await queryRunner.release()
            }),
        ))

    it("should insert and read User with abstract intermediate columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.reputation = 100
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOneBy({ id: user.id })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Alice")
                expect(loaded!.email).to.equal("alice@example.com")
                expect(loaded!.reputation).to.equal(100)
            }),
        ))

    it("should load polymorphically via parent repo with correct columns per child", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Alice"
                user.email = "alice@example.com"
                user.reputation = 50
                await connection.getRepository(User).save(user)

                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)

                const loadedUser = actors[0] as User
                expect(loadedUser).to.be.instanceOf(User)
                expect(loadedUser.name).to.equal("Alice")
                expect(loadedUser.email).to.equal("alice@example.com")
                expect(loadedUser.reputation).to.equal(50)

                const loadedOrg = actors[1] as Organization
                expect(loadedOrg).to.be.instanceOf(Organization)
                expect(loadedOrg.name).to.equal("Acme")
                expect(loadedOrg.industry).to.equal("Tech")
                expect((loadedOrg as any).reputation).to.be.undefined
            }),
        ))
})
