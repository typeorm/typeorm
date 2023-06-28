import "reflect-metadata"

import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #4646 Add support for temporal (system-versioned) table", () => {
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

                result = await repository.findOneBy({ id: 1 }, timestamp)
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

                results = await repository.find({ timestamp })
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
