import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../src/decorator/columns/Column"
import { expect } from "chai"

@Entity()
class TestEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column({ type: "int", nullable: true })
    age?: number

    @Column({ type: "boolean", default: false })
    active: boolean = false
}

describe("driver > postgres-js > entity operations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
                entities: [TestEntity],
                schemaCreate: true,
                dropSchema: true,
                logging: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create table for entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                const entity = await repo.save({ name: "TableTest" })
                expect(entity.id).to.be.a("number")

                const retrieved = await repo.findOne({
                    where: { id: entity.id },
                })
                expect(retrieved).to.not.be.null
                expect(retrieved?.name).equals("TableTest")
            }),
        ))

    it("should insert entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                const entity = repo.create({ name: "John", age: 30 })
                const savedEntity = await repo.save(entity)

                expect(savedEntity.id).to.be.a("number")
                expect(savedEntity.name).equals("John")
                expect(savedEntity.age).equals(30)
            }),
        ))

    it("should retrieve entity by id", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save({ name: "Jane", age: 25 })

                const entity = await repo.findOne({ where: { name: "Jane" } })
                expect(entity).to.not.be.null
                expect(entity!.name).equals("Jane")
                expect(entity!.age).equals(25)
            }),
        ))

    it("should update entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                const entity = await repo.save({ name: "Bob", age: 35 })

                entity.age = 36
                const updatedEntity = await repo.save(entity)

                expect(updatedEntity.age).equals(36)
            }),
        ))

    it("should delete entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                const entity = await repo.save({ name: "Alice", age: 28 })

                await repo.delete(entity.id)
                const deletedEntity = await repo.findOne({
                    where: { id: entity.id },
                })
                expect(deletedEntity).to.be.null
            }),
        ))

    it("should count entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1" },
                    { name: "User2" },
                    { name: "User3" },
                ])

                const count = await repo.count()
                expect(count).equals(3)
            }),
        ))

    it("should find all entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1" },
                    { name: "User2" },
                    { name: "User3" },
                ])

                const entities = await repo.find()
                expect(entities.length).equals(3)
            }),
        ))

    it("should support batch operations", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                const entities = [
                    { name: "User1", age: 20 },
                    { name: "User2", age: 21 },
                    { name: "User3", age: 22 },
                ]

                const savedEntities = await repo.save(entities)
                expect(savedEntities.length).equals(3)
                expect(savedEntities[0].id).to.be.a("number")
                expect(savedEntities[1].id).to.be.a("number")
                expect(savedEntities[2].id).to.be.a("number")
            }),
        ))
})

describe("driver > postgres-js > query builder operations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
                entities: [TestEntity],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should support basic select query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1", age: 20 },
                    { name: "User2", age: 25 },
                ])

                const users = await repo
                    .createQueryBuilder("u")
                    .select("u.name")
                    .where("u.age > :age", { age: 22 })
                    .getMany()

                expect(users.length).equals(1)
                expect(users[0].name).equals("User2")
            }),
        ))

    it("should support where conditions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1", active: true },
                    { name: "User2", active: false },
                ])

                const activeUsers = await repo
                    .createQueryBuilder("u")
                    .where("u.active = :active", { active: true })
                    .getMany()

                expect(activeUsers.length).equals(1)
                expect(activeUsers[0].name).equals("User1")
            }),
        ))

    it("should support order by", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1", age: 30 },
                    { name: "User2", age: 20 },
                    { name: "User3", age: 25 },
                ])

                const orderedUsers = await repo
                    .createQueryBuilder("u")
                    .orderBy("u.age", "ASC")
                    .getMany()

                expect(orderedUsers[0].age).equals(20)
                expect(orderedUsers[1].age).equals(25)
                expect(orderedUsers[2].age).equals(30)
            }),
        ))

    it("should support limit and offset", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1" },
                    { name: "User2" },
                    { name: "User3" },
                    { name: "User4" },
                ])

                const paginatedUsers = await repo
                    .createQueryBuilder("u")
                    .orderBy("u.id", "ASC")
                    .skip(1)
                    .take(2)
                    .getMany()

                expect(paginatedUsers.length).equals(2)
            }),
        ))

    it("should support aggregation functions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1", age: 20 },
                    { name: "User2", age: 30 },
                    { name: "User3", age: 25 },
                ])

                const result = await repo
                    .createQueryBuilder("u")
                    .select("COUNT(u.id)", "count")
                    .addSelect("AVG(u.age)", "avgAge")
                    .addSelect("MAX(u.age)", "maxAge")
                    .addSelect("MIN(u.age)", "minAge")
                    .getRawOne()

                expect(result).to.not.be.undefined
                expect(Number(result.count)).equals(3)
                expect(Number(result.avgAge)).to.equal(25)
                expect(Number(result.maxAge)).to.equal(30)
                expect(Number(result.minAge)).to.equal(20)
            }),
        ))

    it("should support group by", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(TestEntity)
                await repo.save([
                    { name: "User1", active: true },
                    { name: "User2", active: true },
                    { name: "User3", active: false },
                ])

                const groupedResult = await repo
                    .createQueryBuilder("u")
                    .select("u.active")
                    .addSelect("COUNT(*)", "count")
                    .groupBy("u.active")
                    .orderBy("u.active", "ASC")
                    .getRawMany()

                expect(groupedResult.length).equals(2)
                // Check both potential property names (active or u_active)
                const firstActive =
                    groupedResult[0].active !== undefined
                        ? groupedResult[0].active
                        : groupedResult[0].u_active
                const secondActive =
                    groupedResult[1].active !== undefined
                        ? groupedResult[1].active
                        : groupedResult[1].u_active
                expect(firstActive).to.equal(false)
                expect(secondActive).to.equal(true)
            }),
        ))
})
