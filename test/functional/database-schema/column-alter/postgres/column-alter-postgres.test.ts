import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column alter > postgres", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should ALTER COLUMN TYPE without losing existing rows or default value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Post)
                await repo.save({ id: 1, status: "active" })

                const metadata = dataSource.getMetadata(Post)
                const col = metadata.findColumnWithPropertyName("status")!
                col.type = "text"
                col.length = ""

                await dataSource.synchronize(false)

                const found = await repo.findOneBy({ id: 1 })
                expect(found).to.not.be.null
                expect(found!.status).to.equal("active")

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.findColumnByName("status")!.type.should.be.equal("text")
                expect(table!.findColumnByName("status")!.default).to.not.be
                    .null
            }),
        ))

    it("should ALTER COLUMN length without losing existing rows or default value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Post)
                await repo.save({ id: 1, status: "active" })

                const metadata = dataSource.getMetadata(Post)
                const col = metadata.findColumnWithPropertyName("status")!
                col.length = "100"

                await dataSource.synchronize(false)

                const found = await repo.findOneBy({ id: 1 })
                expect(found).to.not.be.null
                expect(found!.status).to.equal("active")

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!
                    .findColumnByName("status")!
                    .length!.should.be.equal("100")
                expect(table!.findColumnByName("status")!.default).to.not.be
                    .null
            }),
        ))
})
