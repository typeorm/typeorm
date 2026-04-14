import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { User } from "./entity/User"
import { expect } from "chai"

describe("table-inheritance > class-table > self-referential", () => {
    let connections: DataSource[]

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create schema with self-referential FK on child table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const userTable = await queryRunner.getTable("user")
                expect(userTable).to.not.be.undefined
                const userCols = userTable!.columns.map((c) => c.name)
                expect(userCols).to.include("managerId")

                await queryRunner.release()
            }),
        ))

    it("should save and load User with manager (self-ref ManyToOne)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const manager = new User()
                manager.name = "Boss"
                manager.email = "boss@example.com"
                await connection.getRepository(User).save(manager)

                const report = new User()
                report.name = "Worker"
                report.email = "worker@example.com"
                report.manager = manager
                await connection.getRepository(User).save(report)

                const loaded = await connection
                    .getRepository(User)
                    .findOne({
                        where: { id: report.id },
                        relations: { manager: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.manager).to.not.be.null
                expect(loaded!.manager).to.be.instanceOf(User)
                expect(loaded!.manager.name).to.equal("Boss")
                expect(loaded!.manager.email).to.equal("boss@example.com")
            }),
        ))

    it("should load User with directReports (self-ref OneToMany)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const manager = new User()
                manager.name = "Boss"
                manager.email = "boss@example.com"
                await connection.getRepository(User).save(manager)

                const report1 = new User()
                report1.name = "Alice"
                report1.email = "alice@example.com"
                report1.manager = manager
                await connection.getRepository(User).save(report1)

                const report2 = new User()
                report2.name = "Bob"
                report2.email = "bob@example.com"
                report2.manager = manager
                await connection.getRepository(User).save(report2)

                const loaded = await connection
                    .getRepository(User)
                    .findOne({
                        where: { id: manager.id },
                        relations: { directReports: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.directReports).to.have.length(2)
                expect(
                    loaded!.directReports.map((r) => r.name).sort(),
                ).to.deep.equal(["Alice", "Bob"])
            }),
        ))

    it("should load multi-level manager chain via QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const vp = new User()
                vp.name = "VP"
                vp.email = "vp@example.com"
                await connection.getRepository(User).save(vp)

                const mgr = new User()
                mgr.name = "Manager"
                mgr.email = "mgr@example.com"
                mgr.manager = vp
                await connection.getRepository(User).save(mgr)

                const dev = new User()
                dev.name = "Dev"
                dev.email = "dev@example.com"
                dev.manager = mgr
                await connection.getRepository(User).save(dev)

                const loaded = await connection
                    .getRepository(User)
                    .createQueryBuilder("u")
                    .leftJoinAndSelect("u.manager", "m")
                    .leftJoinAndSelect("m.manager", "gm")
                    .where("u.id = :id", { id: dev.id })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Dev")
                expect(loaded!.manager).to.not.be.null
                expect(loaded!.manager.name).to.equal("Manager")
                expect(loaded!.manager.manager).to.not.be.null
                expect(loaded!.manager.manager.name).to.equal("VP")
            }),
        ))

    it("should handle User with no manager (null self-ref)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const user = new User()
                user.name = "Solo"
                user.email = "solo@example.com"
                await connection.getRepository(User).save(user)

                const loaded = await connection
                    .getRepository(User)
                    .findOne({
                        where: { id: user.id },
                        relations: { manager: true },
                    })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Solo")
                expect(loaded!.manager).to.be.null
            }),
        ))
})
