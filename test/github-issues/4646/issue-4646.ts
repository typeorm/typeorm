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

    xit("should handle the parameter timestamp correct in the QueryBuilder", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // const timestamp = new Date("2050-01-01T00:00:00.000Z")

                const sqlOne = dataSource
                    .createQueryBuilder(User, "user")
                    .select("*")
                    .disableEscaping()
                    // .at(timestamp)
                    .getSql()

                expect(sqlOne).to.equal(
                    "SELECT * FROM user FOR SYSTEM_TIME AS OF :timestamp user",
                )
            }),
        ))

    it("should handle the parameter timestamp correct in the BaseEntity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                User.useDataSource(dataSource)

                const user = new User()
                user.id = 1
                user.name = "foo"
                await user.save()

                const timestamp = new Date()
                let result = await User.findOneBy({ id: 1 })
                expect(result?.name).to.be.equal("foo")

                user.name = "bar"
                await user.save()

                result = await User.findOneBy({ id: 1 })
                expect(result?.name).to.be.equal("bar")

                result = await User.findOneAt(timestamp, { where: { id: 1 } })
                expect(result?.name).to.be.equal("foo")

                let users = await User.findAt(timestamp)
                expect(users).to.be.eql([{ id: 1, name: "foo" }])

                users = await User.findAt(timestamp, { where: { id: 1 } })
                expect(users).to.be.eql([{ id: 1, name: "foo" }])

                await user.remove()
            }),
        ))

    it("should handle the parameter timestamp correct in all find methods from the Repository", () =>
        Promise.all(
            dataSources.map(async ({ manager }) => {
                const repository = manager.getRepository(User)

                const user = new User()
                user.id = 1
                user.name = "foo"
                await repository.save(user)

                const timestamp = new Date()
                let result = await repository.findOneBy({ id: 1 })
                expect(result?.name).to.be.equal("foo")

                await repository.update(1, { name: "bar" })

                result = await repository.findOne({ where: { id: 1 } })
                expect(result?.name).to.be.equal("bar")

                // check user name from the history
                let users = await repository.findAt(timestamp)
                expect(users).to.be.eql([{ id: 1, name: "foo" }])

                users = await repository.findAt(timestamp, { where: { id: 1 } })
                expect(users).to.be.eql([{ id: 1, name: "foo" }])

                result = await repository.findOneAt(timestamp, {
                    where: { id: 1 },
                })
                expect(result?.name).to.be.equal("foo")

                await repository.delete(1)
            }),
        ))

    it("should get deleted datasets from the history", () =>
        Promise.all(
            dataSources.map(async ({ manager }) => {
                const repository = manager.getRepository(User)

                const userOne = new User()
                userOne.id = 1
                userOne.name = "foo"
                await repository.save(userOne)

                const userTwo = new User()
                userTwo.id = 2
                userTwo.name = "bar"
                await repository.save(userTwo)

                const timestamp = new Date()
                let results = await repository.find()
                expect(results).to.have.length(2)

                await repository.delete(2)

                results = await repository.find()
                expect(results).to.have.length(1)

                results = await repository.findAt(timestamp)
                expect(results).to.have.length(2)

                await repository.delete(1)
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
