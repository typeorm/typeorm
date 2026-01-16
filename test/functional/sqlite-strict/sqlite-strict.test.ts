import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { StrictUser } from "./entity/StrictUser"
import { StrictAny } from "./entity/StrictAny"

describe("sqlite strict mode", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3", "sqlite", "sqljs"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource, index: number = 1) {
        const user = new StrictUser()
        user.firstName = "Alice" + index
        user.email = "alice" + index + "@example.com"
        user.lastName = "Smith"
        user.age = 16
        user.class = 10
        user.experience = 5
        user.score = 88.5
        user.weight = 55.0
        user.height = 5.6
        user.data = Buffer.from("Sample binary data")
        user.anyField = { key: "value" }

        return await dataSource.manager.save(user)
    }

    it("should create table with STRICT keyword when strict option is enabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.true

                const sql = await dataSource.query(
                    `SELECT sql FROM sqlite_master WHERE name = 'strict_user'`,
                )
                expect(sql[0].sql).to.include("STRICT")
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

                const sql = await dataSource.query(
                    `SELECT sql FROM sqlite_master WHERE name = 'non_strict_user'`,
                )
                expect(sql[0].sql).to.not.include("STRICT")
                await queryRunner.release()
            }),
        ))

    it("should convert common types to strict-compatible types", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined

                const textFields = ["firstName", "email", "lastName"]
                textFields.forEach((field) => {
                    const column = table!.findColumnByName(field)
                    expect(column).to.not.be.undefined
                    expect(column!.type).to.equal("text")
                })

                const integerFields = ["age", "class", "experience"]
                integerFields.forEach((field) => {
                    const column = table!.findColumnByName(field)
                    expect(column).to.not.be.undefined
                    expect(column!.type).to.equal("integer")
                })

                const floatFields = ["score", "weight", "height"]
                floatFields.forEach((field) => {
                    const column = table!.findColumnByName(field)
                    expect(column).to.not.be.undefined
                    expect(column!.type).to.equal("real")
                })

                const createdAtField = table!.findColumnByName("createdAt")
                expect(createdAtField).to.not.be.undefined
                expect(createdAtField!.type).to.equal("text")

                const dataField = table!.findColumnByName("data")
                expect(dataField).to.not.be.undefined
                expect(dataField!.type).to.equal("blob")

                const anyField = table!.findColumnByName("anyField")
                expect(anyField).to.not.be.undefined
                expect(anyField!.type).to.equal("any")
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
                const email = table!.findColumnByName("email")
                expect(email).to.not.be.undefined
                expect(email!.isUnique).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should insert records with all data types in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = await prepareData(dataSource)
                const loadResult = await dataSource
                    .getRepository(StrictUser)
                    .findOne({ where: { id: user.id } })
                expect(loadResult).to.deep.equal({
                    ...user,
                    id: loadResult!.id,
                })
            }),
        ))

    it("should select records with where conditions in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = await prepareData(dataSource)

                const loadedUser = await dataSource
                    .getRepository(StrictUser)
                    .findOne({
                        where: { firstName: "Alice1", age: 16 },
                    })
                expect(loadedUser).to.deep.equal({
                    ...user,
                    id: loadedUser!.id,
                })
            }),
        ))

    it("should update records in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = await prepareData(dataSource)

                user.data = Buffer.from("Updated binary data")
                user.score = 82.5

                await dataSource.manager.save(user)
                const updatedUser = await dataSource
                    .getRepository(StrictUser)
                    .findOne({
                        where: { id: user.id },
                    })

                expect(updatedUser).to.deep.equal({
                    ...user,
                    id: user.id,
                })
            }),
        ))

    it("should delete records in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = await prepareData(dataSource)
                await dataSource.manager.remove(user)

                const deletedUser = await dataSource.manager.findOne(
                    StrictUser,
                    {
                        where: { id: user.id },
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
                    users.push(await prepareData(dataSource, i))
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
                    users.push(await prepareData(dataSource, i))
                }

                await dataSource.manager.save(users)

                await dataSource.manager.delete(StrictUser, { age: 16 })

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
                    users.push(await prepareData(dataSource, i))
                }

                await dataSource.manager.save(users)

                await dataSource.manager.update(
                    StrictUser,
                    { age: 16 },
                    { data: Buffer.from("Bulk updated") },
                )

                const updatedUsers = await dataSource.manager.find(StrictUser, {
                    where: { age: 16 },
                })

                expect(updatedUsers).to.have.length(3)
                updatedUsers.forEach((user) => {
                    expect(user.data).to.deep.equal(Buffer.from("Bulk updated"))
                })
            }),
        ))

    it("should select with query builder in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const users = [
                    {
                        firstName: "Henry",
                        email: "henry@example.com",
                        lastName: "Adams",
                        age: 45,
                        score: 95.0,
                    },
                    {
                        firstName: "Iris",
                        email: "iris@example.com",
                        lastName: "Johnson",
                        age: 22,
                        score: 65.0,
                    },
                ]

                await dataSource.getRepository(StrictUser).save(users)

                const highScorers = await dataSource
                    .getRepository(StrictUser)
                    .createQueryBuilder("user")
                    .where("user.score >= :minScore", { minScore: 90 })
                    .getMany()

                expect(highScorers).to.have.length(1)
                expect(highScorers[0].firstName).to.equal("Henry")
            }),
        ))

    it("should handle transactions in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.transaction(
                    async (transactionalEntityManager) => {
                        const user1 = new StrictUser()
                        user1.firstName = "Jack"
                        user1.email = "jack@example.com"
                        user1.lastName = "Brown"
                        user1.age = 33
                        user1.score = 88.0
                        user1.data = Buffer.from("Transaction data 1")

                        const user2 = new StrictUser()
                        user2.firstName = "Kelly"
                        user2.email = "kelly@example.com"
                        user2.lastName = "Davis"
                        user2.age = 27
                        user2.score = 92.5
                        user2.data = Buffer.from("Transaction data 2")

                        await transactionalEntityManager.save([user1, user2])
                    },
                )

                const count = await dataSource.manager.count(StrictUser)
                expect(count).to.equal(2)
            }),
        ))

    it("should handle any type with strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const anyEntity1 = new StrictAny()
                anyEntity1.anyField = 39
                anyEntity1.anotherAnyField = "A string value"
                anyEntity1.yetAnotherAnyField = {
                    nested: "object",
                    arr: [1, 2, 3],
                }

                const savedEntity = await dataSource
                    .getRepository(StrictAny)
                    .save(anyEntity1)

                const loadedEntity = await dataSource
                    .getRepository(StrictAny)
                    .findOne({ where: { id: savedEntity.id } })
                expect(loadedEntity).to.deep.equal({
                    ...savedEntity,
                    id: loadedEntity!.id,
                })

                const anyEntity2 = new StrictAny()
                anyEntity2.anyField = { foo: "bar", num: 42 }
                anyEntity2.anotherAnyField = false
                anyEntity2.yetAnotherAnyField = 93.5

                const savedEntity2 = await dataSource
                    .getRepository(StrictAny)
                    .save(anyEntity2)

                const loadedEntity2 = await dataSource
                    .getRepository(StrictAny)
                    .findOne({ where: { id: savedEntity2.id } })
                expect(loadedEntity2).to.deep.equal({
                    ...savedEntity2,
                    id: loadedEntity2!.id,
                })
            }),
        ))
})
