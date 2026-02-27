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

describe("table-inheritance > class-table > cross-child-references", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create correct schema with cross-child FK columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const userTable = await queryRunner.getTable("user")
                expect(userTable).to.not.be.undefined
                const userCols = userTable!.columns.map((c) => c.name)
                expect(userCols).to.include("employerId")

                const orgTable = await queryRunner.getTable("organization")
                expect(orgTable).to.not.be.undefined
                const orgCols = orgTable!.columns.map((c) => c.name)
                expect(orgCols).to.include("ceoId")

                await queryRunner.release()
            }),
        ))

    it("should save and load User with Organization employer (ManyToOne cross-child)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme Corp"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@acme.com"
                user.employer = org
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOne({
                        where: { id: user.id },
                        relations: { employer: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.employer).to.not.be.null
                expect(loaded!.employer).to.be.instanceOf(Organization)
                expect(loaded!.employer.name).to.equal("Acme Corp")
                expect(loaded!.employer.industry).to.equal("Tech")
            }),
        ))

    it("should save and load Organization with User CEO (ManyToOne cross-child)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ceo = new User()
                ceo.name = "Bob"
                ceo.email = "bob@acme.com"
                await connection.getRepository(User).save(ceo)

                const org = new Organization()
                org.name = "Acme Corp"
                org.industry = "Tech"
                org.ceo = ceo
                await connection.getRepository(Organization).save(org)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOne({
                        where: { id: org.id },
                        relations: { ceo: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.ceo).to.not.be.null
                expect(loaded!.ceo).to.be.instanceOf(User)
                expect(loaded!.ceo.name).to.equal("Bob")
                expect(loaded!.ceo.email).to.equal("bob@acme.com")
            }),
        ))

    it("should load Organization with members (OneToMany cross-child)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme Corp"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const user1 = new User()
                user1.name = "Alice"
                user1.email = "alice@acme.com"
                user1.employer = org
                await connection.getRepository(User).save(user1)

                const user2 = new User()
                user2.name = "Charlie"
                user2.email = "charlie@acme.com"
                user2.employer = org
                await connection.getRepository(User).save(user2)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOne({
                        where: { id: org.id },
                        relations: { members: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.members).to.have.length(2)
                expect(loaded!.members.map((m) => m.name).sort()).to.deep.equal(
                    ["Alice", "Charlie"],
                )
            }),
        ))

    it("should load cross-child relations via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme Corp"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@acme.com"
                user.employer = org
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .leftJoinAndSelect("u.employer", "e")
                    .where("u.id = :id", { id: user.id })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.employer).to.not.be.null
                expect(loaded!.employer.name).to.equal("Acme Corp")
            }),
        ))

    it("should load bidirectional cross-child relations (CEO + members)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const ceo = new User()
                ceo.name = "Boss"
                ceo.email = "boss@acme.com"
                await connection.getRepository(User).save(ceo)

                const org = new Organization()
                org.name = "Acme Corp"
                org.industry = "Tech"
                org.ceo = ceo
                await connection.getRepository(Organization).save(org)

                // Set employer after org is saved
                ceo.employer = org
                await connection.getRepository(User).save(ceo)

                const employee = new User()
                employee.name = "Worker"
                employee.email = "worker@acme.com"
                employee.employer = org
                await connection.getRepository(User).save(employee)

                const loaded = await connection
                    .getRepository(Organization)
                    .findOne({
                        where: { id: org.id },
                        relations: { ceo: true, members: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.ceo).to.not.be.null
                expect(loaded!.ceo.name).to.equal("Boss")
                expect(loaded!.members).to.have.length(2)
            }),
        ))

    it("should return correct polymorphic types via parent repo with cross-child relations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const org = new Organization()
                org.name = "Acme"
                org.industry = "Tech"
                await connection.getRepository(Organization).save(org)

                const user = new User()
                user.name = "Alice"
                user.email = "alice@acme.com"
                user.employer = org
                await connection.getRepository(User).save(user)

                const actors = await connection
                    .getRepository(Actor)
                    .find({ order: { id: "ASC" } })

                expect(actors).to.have.length(2)
                expect(actors[0]).to.be.instanceOf(Organization)
                expect(actors[1]).to.be.instanceOf(User)
            }),
        ))
})
