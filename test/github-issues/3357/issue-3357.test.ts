import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering resulting in data loss", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve data when changing column length", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Post)
                await repo.save({ title: "Hello World" })

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                const oldColumn = table!.findColumnByName("title")!

                const newColumn = oldColumn.clone()
                newColumn.length = "100"

                await queryRunner.changeColumn(table!, oldColumn, newColumn)

                const updatedTable = await queryRunner.getTable("post")
                const updatedColumn = updatedTable!.findColumnByName("title")!
                expect(updatedColumn.length).to.equal("100")

                const post = await repo.findOneBy({ id: 1 })
                expect(post!.title).to.equal("Hello World")

                await queryRunner.release()
            }),
        )
    })

    it("should generate ALTER COLUMN TYPE for length-only changes", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                queryRunner.enableSqlMemory()

                const table = await queryRunner.getTable("post")
                const oldColumn = table!.findColumnByName("title")!

                const newColumn = oldColumn.clone()
                newColumn.length = "100"

                await queryRunner.changeColumn(table!, oldColumn, newColumn)

                const sqlInMemory = queryRunner.getMemorySql()
                const upQueries = sqlInMemory.upQueries.map((q) => q.query)

                const hasDrop = upQueries.some((q: string) =>
                    q.includes("DROP COLUMN"),
                )
                const hasAlter = upQueries.some(
                    (q: string) =>
                        q.includes("ALTER COLUMN") && q.includes("TYPE"),
                )

                expect(hasDrop).to.not.be.true
                expect(hasAlter).to.be.true

                queryRunner.clearSqlMemory()
                await queryRunner.release()
            }),
        )
    })
})
