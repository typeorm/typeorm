import "reflect-metadata"

import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #4646 add support for temporal (system-versioned) table", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            dropSchema: true,
            enabledDrivers: ["mariadb", "mssql"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should get correct dataset at a specific timestamp", () =>
        Promise.all(
            dataSources.map(async ({ manager }) => {
                const repository = manager.getRepository(User)

                const user = new User()
                user.name = "foo"
                await repository.save(user)

                const timestamp = new Date()
                let result = await repository.findOneBy({ id: 1 })
                expect(result?.name).to.be.equal("foo")

                await repository.update(1, { name: "bar" })

                result = await repository.findOne({ where: { id: 1 } })
                expect(result?.name).to.be.equal("bar")

                // check user name from the history
                let users = await repository.find(timestamp)
                expect(users).to.be.eql([{ id: 1, name: "foo" }])

                users = await repository.findBy({ id: 1 }, timestamp)
                expect(users).to.be.eql([{ id: 1, name: "foo" }])

                result = await repository.findOneBy({ id: 1 }, timestamp)
                expect(result?.name).to.be.equal("foo")

                result = await repository.findOne(
                    { where: { id: 1 } },
                    timestamp,
                )
                expect(result?.name).to.be.equal("foo")

                result = await repository.findOneOrFail(
                    { where: { id: 1 } },
                    timestamp,
                )
                expect(result?.name).to.be.equal("foo")

                await repository.delete(1)
            }),
        ))

    it("should get deleted datasets", () =>
        Promise.all(
            dataSources.map(async ({ manager }) => {
                const repository = manager.getRepository(User)

                const userOne = new User()
                userOne.name = "foo"
                await repository.save(userOne)

                const userTwo = new User()
                userTwo.name = "bar"
                await repository.save(userTwo)

                const timestamp = new Date()
                let results = await repository.find()
                expect(results).to.have.length(2)

                await repository.delete(2)

                results = await repository.find()
                expect(results).to.have.length(1)

                results = await repository.find(timestamp)
                expect(results).to.have.length(2)

                await repository.delete(1)
            }),
        ))

    it("should return FROM clause including system time expression (QueryBuilder support)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const timestamp = new Date("2050-01-01T00:00:00.000Z")
                const sql = dataSource
                    .createQueryBuilder()
                    .from(User, "user", timestamp)
                    .disableEscaping()
                    .getSql()

                expect(sql).to.equal(
                    "SELECT * FROM user FOR SYSTEM_TIME AS OF '2050-01-01 00:00:00.000' user",
                )
            }),
        ))

    it("should return FROM clause including system time expression (QueryBuilder support)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const timestamp = new Date("2050-01-01T00:00:00.000Z")
                const sql = dataSource
                    .createQueryBuilder(User, "user", timestamp)
                    .select("*")
                    .disableEscaping()
                    .getSql()

                expect(sql).to.equal(
                    "SELECT * FROM user FOR SYSTEM_TIME AS OF '2050-01-01 00:00:00.000' user",
                )
            }),
        ))

    it("should ignore internal columns which are used for temporal tables", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.have.length(0)
                expect(sqlInMemory.downQueries).to.have.length(0)
            }),
        ))
})
