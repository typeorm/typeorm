import "reflect-metadata"

import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    sleep,
} from "../../utils/test-utils"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

const getCurrentTimestamp = async () => {
    // give some time to simulate dataset modifications
    await sleep(100)
    const timestamp = new Date()
    await sleep(100)
    return timestamp
}

describe("github issues > #4646 add support for temporal (system-versioned) table", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            dropSchema: true,
            enabledDrivers: ["mariadb", "mssql"],
            entities: [Photo, User],
            schemaCreate: false,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should honor temporal table options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const { upQueries } = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                if (dataSource.driver.options.type === "mssql") {
                    expect(upQueries[0].query).to.include(
                        "DATA_CONSISTENCY_CHECK = OFF",
                    )

                    expect(upQueries[0].query).to.include(
                        "HISTORY_TABLE = dbo.user_history",
                    )

                    expect(upQueries[0].query).to.include(
                        "valid_from DATETIME2 GENERATED ALWAYS AS ROW START HIDDEN NOT NULL",
                    )

                    expect(upQueries[0].query).to.include(
                        "valid_to DATETIME2 GENERATED ALWAYS AS ROW END HIDDEN NOT NULL",
                    )
                }

                await dataSource.synchronize()
            }),
        ))

    it("should check new find methods from the BaseEntity class", async () => {
        // this test has to run serial because class User exists only once
        for (const dataSource of dataSources) {
            User.useDataSource(dataSource)

            const user = new User()
            user.id = 1
            user.name = "foo"
            await dataSource.manager.save(user)

            const timestamp = await getCurrentTimestamp()

            let result = await User.findOneAsOf({ where: { id: 1 } })
            expect(result?.name).to.be.equal("foo")

            user.name = "bar"
            await dataSource.manager.save(user)

            result = await User.findOneAsOf({ where: { id: 1 } })
            expect(result?.name).to.be.equal("bar")

            result = await User.findOneAsOf({ where: { id: 1 } }, timestamp)
            expect(result?.name).to.be.equal("foo")

            let users = await User.findAsOf()
            expect(users[0].name).to.be.eql("bar")

            users = await User.findAsOf(timestamp)
            expect(users[0].name).to.be.eql("foo")

            users = await User.findAsOf({ where: { id: 1 } }, timestamp)
            expect(users[0].name).to.be.eql("foo")

            await user.remove()
        }
    })

    it("should check new find methods from the Repository class", () =>
        Promise.all(
            dataSources.map(async ({ manager }) => {
                const repository = manager.getRepository(User)

                const user = new User()
                user.id = 1
                user.name = "foo"
                await manager.save(user)

                const timestamp = await getCurrentTimestamp()

                let result = await repository.findOneAsOf({ where: { id: 1 } })
                expect(result?.name).to.be.equal("foo")

                user.name = "bar"
                await manager.save(user)

                result = await repository.findOneAsOf({ where: { id: 1 } })
                expect(result?.name).to.be.equal("bar")

                // check user name from the history
                let users = await repository.findAsOf(timestamp)
                expect(users[0].name).to.be.eql("foo")

                users = await repository.findAsOf(
                    { where: { id: 1 } },
                    timestamp,
                )
                expect(users[0].name).to.be.eql("foo")

                result = await repository.findOneAsOf(
                    { where: { id: 1 } },
                    timestamp,
                )
                expect(result?.name).to.be.equal("foo")

                await repository.delete(1)
            }),
        ))

    it("should get deleted datasets from the temporal tables (history)", () =>
        Promise.all(
            dataSources.map(async ({ manager }) => {
                const repository = manager.getRepository(User)

                const userOne = new User()
                userOne.id = 1
                userOne.name = "foo"
                await manager.save(userOne)

                const userTwo = new User()
                userTwo.id = 2
                userTwo.name = "bar"
                await manager.save(userTwo)

                const timestamp = await getCurrentTimestamp()

                let results = await repository.findAsOf()
                expect(results).to.have.length(2)

                await repository.delete(2)

                results = await repository.findAsOf()
                expect(results).to.have.length(1)

                results = await repository.findAsOf(timestamp)
                expect(results).to.have.length(2)

                await repository.delete(1)
            }),
        ))

    it("should ignore internal columns (row_start, row_end) which are used for temporal tables", () =>
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

    it("should also working with joins", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { manager } = dataSource

                const user = new User()
                user.id = 1
                user.name = "foo"
                await manager.save(user)

                const photo = new Photo()
                photo.user = user
                await manager.save(photo)

                const timestamp = await getCurrentTimestamp()

                await manager.update(User, 1, { name: "bar" })

                const result1 = await dataSource
                    .createQueryBuilder(Photo, "photo")
                    .innerJoinAndSelect("photo.user", "user")
                    .getOne()

                const result2 = await dataSource
                    .createQueryBuilder(Photo, "photo")
                    .innerJoinAndSelect("photo.user", "user")
                    .getOne(timestamp)

                expect(result2).to.deep.equal({
                    id: 1,
                    user: { id: 1, name: "foo" },
                })

                expect(result1).to.deep.equal({
                    id: 1,
                    user: { id: 1, name: "bar" },
                })
            }),
        ))
})
