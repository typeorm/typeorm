import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("columns > date value", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mariadb",
                "mssql",
                "mysql",
                "oracle",
                "postgres",
                "sap",
                "sqljs",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create the columns without a default or ON UPDATE clause", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                for (const name of ["createdAt", "updatedAt"]) {
                    const column = table!.findColumnByName(name)!
                    expect(column.default).to.be.undefined
                    expect(column.onUpdate).to.be.undefined
                }
            }),
        ))

    it("should insert the generated values on save", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                const post = await repository.save({ id: 1, title: "a" })

                expect(post.createdAt).to.be.a("string")
                expect(post.updatedAt).to.be.a("string")

                const loaded = await repository.findOneByOrFail({ id: 1 })
                expect(loaded.createdAt).to.equal(post.createdAt)
                expect(loaded.updatedAt).to.equal(post.updatedAt)
            }),
        ))

    it("should keep a value given for the column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                const createdAt = "2000-01-01T00:00:00.000Z"
                await repository.save({ id: 1, title: "a", createdAt })

                const loaded = await repository.findOneByOrFail({ id: 1 })
                expect(loaded.createdAt).to.equal(createdAt)
            }),
        ))

    it("should set a new update value on save, update and soft delete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                const post = await repository.save({ id: 1, title: "a" })
                const { createdAt } = post
                let { updatedAt } = post

                const expectUpdated = async () => {
                    const loaded = await repository.findOneOrFail({
                        where: { id: 1 },
                        withDeleted: true,
                    })
                    expect(loaded.createdAt).to.equal(createdAt)
                    expect(loaded.updatedAt > updatedAt).to.be.true
                    updatedAt = loaded.updatedAt
                }

                post.title = "b"
                await repository.save(post)
                await expectUpdated()

                await repository.update({ id: 1 }, { title: "c" })
                await expectUpdated()

                await repository.softDelete({ id: 1 })
                await expectUpdated()

                await repository.restore({ id: 1 })
                await expectUpdated()
            }),
        ))

    it("should set a new update value on upsert", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { supportedUpsertTypes } = dataSource.driver
                if (
                    !supportedUpsertTypes.includes("on-conflict-do-update") &&
                    !supportedUpsertTypes.includes("on-duplicate-key-update")
                )
                    return

                const repository = dataSource.getRepository(Post)
                const post = await repository.save({ id: 1, title: "a" })

                await repository.upsert({ id: 1, title: "b" }, ["id"])

                const loaded = await repository.findOneByOrFail({ id: 1 })
                expect(loaded.title).to.equal("b")
                expect(loaded.createdAt).to.equal(post.createdAt)
                expect(loaded.updatedAt > post.updatedAt).to.be.true
            }),
        ))
})
