import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Document } from "./entity/Document"

describe("columns > insert-control", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should use default value when insert: false column is set", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type === "spanner") return

                const postRepository = dataSource.getRepository(Post)

                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorFirstName = "Umed"
                post.authorLastName = "Good"
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.title).to.be.equal("About columns")
                expect(loadedPost.text).to.be.equal("Some text about columns")
                expect(loadedPost.authorFirstName).to.be.equal("Default")
                expect(loadedPost.authorLastName).to.be.equal("Default")
            }),
        ))

    it("should ignore provided value for insert: false column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type === "spanner") return

                const doc = new Document()
                doc.id = 1
                doc.version = 42
                await dataSource.manager.save(doc)
                const loaded = await dataSource
                    .getRepository(Document)
                    .findOneBy({ id: 1 })
                expect(loaded!.version).to.be.equal(1)
            }),
        ))

    it("should be able to create an entity with non-inserted column missing from the database", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type === "spanner") return

                let queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropColumn("document", "permission")
                await queryRunner.release()

                const doc = new Document()
                doc.id = 1
                await dataSource.manager.save(doc)
                const docs = dataSource.getRepository(Document)
                expect(await docs.count()).to.eql(1)

                queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropColumn("document", "name")
                await queryRunner.release()
                const doc2 = new Document()
                doc2.id = 2
                return dataSource.manager.save(doc2).should.be.rejected
            }),
        ))
})
