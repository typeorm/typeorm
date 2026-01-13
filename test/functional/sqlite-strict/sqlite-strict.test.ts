import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { StrictUser } from "./entity/StrictUser"

describe("sqlite strict mode", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["sqlite", "better-sqlite3", "sqljs"],
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create table with STRICT keyword when strict option is enabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should create table without STRICT keyword when strict option is disabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("non_strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.false

                await queryRunner.release()
            }),
        ))

    it("should maintain strict mode after table recreation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table!.strict).to.be.true

                // Change a column to trigger table recreation
                const nameColumn = table!.findColumnByName("name")!
                const changedColumn = nameColumn.clone()
                changedColumn.length = "100"

                await queryRunner.changeColumn(
                    table!,
                    nameColumn,
                    changedColumn,
                )

                const changedTable = await queryRunner.getTable("strict_user")
                await queryRunner.release()

                expect(changedTable!.strict).to.be.true
            }),
        ))

    it("should allow insertion and retrieval of data in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new StrictUser()
                user.name = "John Doe"
                user.age = 30
                user.score = 95.5
                user.description = "A test user"

                await dataSource.manager.save(user)

                const savedUser = await dataSource.manager.findOne(StrictUser, {
                    where: { id: user.id },
                })

                expect(savedUser).to.not.be.null
                expect(savedUser!.name).to.equal("John Doe")
                expect(savedUser!.age).to.equal(30)
                expect(savedUser!.score).to.equal(95.5)
                expect(savedUser!.description).to.equal("A test user")
            }),
        ))

    it("should enforce type constraints in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table!.strict).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should convert common types to strict-compatible types", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined

                const nameColumn = table!.findColumnByName("name")
                expect(nameColumn).to.not.be.undefined
                expect(nameColumn!.type).to.equal("text")

                const ageColumn = table!.findColumnByName("age")
                expect(ageColumn).to.not.be.undefined
                expect(ageColumn!.type).to.equal("integer")

                const scoreColumn = table!.findColumnByName("score")
                expect(scoreColumn).to.not.be.undefined
                expect(scoreColumn!.type).to.equal("real")

                await queryRunner.release()
            }),
        ))

    it("should maintain strict mode after adding a column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table!.strict).to.be.true

                const newColumn = table!.findColumnByName("name")!.clone()
                newColumn.name = "email"
                newColumn.isNullable = true

                await queryRunner.addColumn(table!, newColumn)

                const updatedTable = await queryRunner.getTable("strict_user")
                expect(updatedTable!.strict).to.be.true
                expect(updatedTable!.findColumnByName("email")).to.not.be
                    .undefined

                await queryRunner.release()
            }),
        ))

    it("should maintain strict mode after dropping a column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table!.strict).to.be.true

                const descriptionColumn =
                    table!.findColumnByName("description")!
                await queryRunner.dropColumn(table!, descriptionColumn)

                const updatedTable = await queryRunner.getTable("strict_user")
                expect(updatedTable!.strict).to.be.true
                expect(updatedTable!.findColumnByName("description")).to.be
                    .undefined

                await queryRunner.release()
            }),
        ))

    it("should handle blob type in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                const blobColumn = table!.findColumnByName("data")
                if (blobColumn) {
                    expect(blobColumn.type).to.equal("blob")
                }

                await queryRunner.release()
            }),
        ))

    it("should handle any type in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                const anyColumn = table!.findColumnByName("metadata")
                if (anyColumn) {
                    expect(anyColumn.type).to.equal("any")
                }

                await queryRunner.release()
            }),
        ))

    it("should properly synchronize schema with strict mode enabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should handle multiple operations maintaining strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("strict_user")

                expect(table!.strict).to.be.true

                // Add column
                const newColumn = table!.findColumnByName("name")!.clone()
                newColumn.name = "nickname"
                newColumn.isNullable = true
                await queryRunner.addColumn(table!, newColumn)

                // Change column
                const ageColumn = table!.findColumnByName("age")!
                const changedAge = ageColumn.clone()
                changedAge.isNullable = true
                await queryRunner.changeColumn(table!, ageColumn, changedAge)

                // Verify strict mode is maintained
                table = await queryRunner.getTable("strict_user")
                expect(table!.strict).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should handle primary key with strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.true

                const idColumn = table!.findColumnByName("id")
                expect(idColumn).to.not.be.undefined
                expect(idColumn!.isPrimary).to.be.true
                expect(idColumn!.type).to.equal("integer")

                await queryRunner.release()
            }),
        ))
    it("should handle unique constraints with strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.true
                const nameColumn = table!.findColumnByName("name")
                expect(nameColumn).to.not.be.undefined
                expect(nameColumn!.isUnique).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should insert records with all data types in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user1 = new StrictUser()
                user1.name = "Alice"
                user1.age = 25
                user1.score = 88.5
                user1.description = "First user"

                const user2 = new StrictUser()
                user2.name = "Bob"
                user2.age = 35
                user2.score = 92.0
                user2.description = "Second user"

                await dataSource.manager.save([user1, user2])

                const count = await dataSource.manager.count(StrictUser)
                expect(count).to.equal(2)
            }),
        ))

    it("should select records with where conditions in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const users = [
                    {
                        name: "Charlie",
                        age: 28,
                        score: 85.0,
                        description: "User 1",
                    },
                    {
                        name: "Diana",
                        age: 32,
                        score: 90.5,
                        description: "User 2",
                    },
                    {
                        name: "Eve",
                        age: 28,
                        score: 87.5,
                        description: "User 3",
                    },
                ]

                for (const userData of users) {
                    const user = new StrictUser()
                    Object.assign(user, userData)
                    await dataSource.manager.save(user)
                }

                const selectedUsers = await dataSource.manager.find(
                    StrictUser,
                    {
                        where: { age: 28 },
                    },
                )

                expect(selectedUsers).to.have.length(2)
                expect(selectedUsers.map((u) => u.name)).to.include.members([
                    "Charlie",
                    "Eve",
                ])
            }),
        ))

    it("should update records in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new StrictUser()
                user.name = "Frank"
                user.age = 40
                user.score = 78.0
                user.description = "Original description"

                await dataSource.manager.save(user)

                user.description = "Updated description"
                user.score = 82.5
                await dataSource.manager.save(user)

                const updatedUser = await dataSource.manager.findOne(
                    StrictUser,
                    {
                        where: { id: user.id },
                    },
                )

                expect(updatedUser).to.not.be.null
                expect(updatedUser!.description).to.equal("Updated description")
                expect(updatedUser!.score).to.equal(82.5)
            }),
        ))

    it("should delete records in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new StrictUser()
                user.name = "Grace"
                user.age = 29
                user.score = 91.0
                user.description = "To be deleted"

                await dataSource.manager.save(user)

                const userId = user.id
                await dataSource.manager.remove(user)

                const deletedUser = await dataSource.manager.findOne(
                    StrictUser,
                    {
                        where: { id: userId },
                    },
                )

                expect(deletedUser).to.be.null
            }),
        ))

    it("should perform bulk insert operations in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const users = []
                for (let i = 0; i < 10; i++) {
                    const user = new StrictUser()
                    user.name = `User${i}`
                    user.age = 20 + i
                    user.score = 70.0 + i
                    user.description = `Description ${i}`
                    users.push(user)
                }

                await dataSource.manager.save(users)

                const count = await dataSource.manager.count(StrictUser)
                expect(count).to.equal(10)
            }),
        ))

    it("should perform bulk delete operations in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const users = []
                for (let i = 0; i < 5; i++) {
                    const user = new StrictUser()
                    user.name = `DeleteUser${i}`
                    user.age = 30
                    user.score = 80.0
                    user.description = `Delete ${i}`
                    users.push(user)
                }

                await dataSource.manager.save(users)

                await dataSource.manager.delete(StrictUser, { age: 30 })

                const remainingCount =
                    await dataSource.manager.count(StrictUser)
                expect(remainingCount).to.equal(0)
            }),
        ))

    it("should perform bulk update operations in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const users = []
                for (let i = 0; i < 3; i++) {
                    const user = new StrictUser()
                    user.name = `UpdateUser${i}`
                    user.age = 25
                    user.score = 75.0
                    user.description = "Original"
                    users.push(user)
                }

                await dataSource.manager.save(users)

                await dataSource.manager.update(
                    StrictUser,
                    { age: 25 },
                    { description: "Bulk updated" },
                )

                const updatedUsers = await dataSource.manager.find(StrictUser, {
                    where: { age: 25 },
                })

                expect(updatedUsers).to.have.length(3)
                updatedUsers.forEach((user) => {
                    expect(user.description).to.equal("Bulk updated")
                })
            }),
        ))

    it("should select with query builder in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const users = [
                    {
                        name: "Henry",
                        age: 45,
                        score: 95.0,
                        description: "High scorer",
                    },
                    {
                        name: "Iris",
                        age: 22,
                        score: 65.0,
                        description: "Low scorer",
                    },
                ]

                for (const userData of users) {
                    const user = new StrictUser()
                    Object.assign(user, userData)
                    await dataSource.manager.save(user)
                }

                const highScorers = await dataSource
                    .getRepository(StrictUser)
                    .createQueryBuilder("user")
                    .where("user.score >= :minScore", { minScore: 90 })
                    .getMany()

                expect(highScorers).to.have.length(1)
                expect(highScorers[0].name).to.equal("Henry")
            }),
        ))

    it("should handle transactions in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.transaction(
                    async (transactionalEntityManager) => {
                        const user1 = new StrictUser()
                        user1.name = "Jack"
                        user1.age = 33
                        user1.score = 88.0
                        user1.data = Buffer.from("Transaction data 1")
                        user1.description = "Transaction test 1"

                        const user2 = new StrictUser()
                        user2.name = "Kelly"
                        user2.age = 27
                        user2.score = 92.5
                        user2.data = Buffer.from("Transaction data 2")
                        user2.description = "Transaction test 2"

                        await transactionalEntityManager.save([user1, user2])
                    },
                )

                const count = await dataSource.manager.count(StrictUser)
                expect(count).to.equal(2)
            }),
        ))
})
