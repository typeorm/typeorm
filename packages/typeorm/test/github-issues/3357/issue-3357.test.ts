import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #3357 avoid destructive column recreation on compatible type alteration in postgres", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve table data when altering column length", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepo = dataSource.getRepository(Post)
                await postRepo.save({
                    title: "Valuable Production Data",
                    count: 42,
                })

                const postMetadata = dataSource.getMetadata(Post)
                const titleColumn =
                    postMetadata.findColumnWithPropertyName("title")!
                titleColumn.length = "500"
                titleColumn.build(dataSource)

                await dataSource.synchronize(false)

                const savedPost = await postRepo.findOneBy({ count: 42 })
                expect(savedPost).to.exist
                expect(savedPost!.title).to.equal("Valuable Production Data")

                const queryRunner = dataSource.createQueryRunner()
                const postTable = await queryRunner.getTable("post")
                await queryRunner.release()

                expect(postTable!.findColumnByName("title")!.length).to.equal(
                    "500",
                )
            }),
        ))
})
