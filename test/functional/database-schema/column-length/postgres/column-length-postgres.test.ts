import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column length > postgres", () => {
    let dataSources: DataSource[]

    function resetPostColumnLengths(dataSource: DataSource) {
        const metadata = dataSource.getMetadata(Post)
        metadata.findColumnWithPropertyName("characterVarying")!.length = "50"
        metadata.findColumnWithPropertyName("varchar")!.length = "50"
        metadata.findColumnWithPropertyName("character")!.length = "50"
        metadata.findColumnWithPropertyName("char")!.length = "50"
    }

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => {
        dataSources.forEach(resetPostColumnLengths)
        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("all types should create with correct size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(
                    table!.findColumnByName("characterVarying")!.length,
                ).to.be.equal("50")
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "50",
                )
                expect(
                    table!.findColumnByName("character")!.length,
                ).to.be.equal("50")
                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "50",
                )
            }),
        ))

    it("all types should update their size", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName(
                    "characterVarying",
                )!.length = "100"
                metadata.findColumnWithPropertyName("varchar")!.length = "100"
                metadata.findColumnWithPropertyName("character")!.length = "100"
                metadata.findColumnWithPropertyName("char")!.length = "100"

                await dataSource.synchronize(false)

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(
                    table!.findColumnByName("characterVarying")!.length,
                ).to.be.equal("100")
                expect(table!.findColumnByName("varchar")!.length).to.be.equal(
                    "100",
                )
                expect(
                    table!.findColumnByName("character")!.length,
                ).to.be.equal("100")
                expect(table!.findColumnByName("char")!.length).to.be.equal(
                    "100",
                )
            }),
        ))

    // regression test for #3357
    it("should preserve data when varchar length changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(Post)
                metadata.findColumnWithPropertyName("varchar")!.length = "50"

                await dataSource.synchronize(true)

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values({
                        id: 1,
                        characterVarying: "character varying value",
                        varchar: "varchar value",
                        character: "character value",
                        char: "char value",
                    })
                    .execute()

                metadata.findColumnWithPropertyName("varchar")!.length = "100"

                await dataSource.synchronize(false)

                const post = await dataSource
                    .createQueryBuilder(Post, "post")
                    .where("post.id = :id", { id: 1 })
                    .getOneOrFail()

                expect(post.varchar).to.be.equal("varchar value")
            }),
        ))
})
