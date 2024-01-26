import "reflect-metadata"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("indices > fulltext index", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create fulltext indices", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")

                table!.indices.length.should.be.equal(2)
                expect(table!.indices[0].isFulltext).to.be.true
                expect(table!.indices[1].isFulltext).to.be.true

                await queryRunner.release()
            }),
        ))

    it("with default parser", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const text = "This is text"
                const post = new Post()
                post.default = text
                post.ngram = text
                await postRepository.save(post)

                const loadedPost1 = await postRepository
                    .createQueryBuilder("post")
                    .where("MATCH(post.default) AGAINST (:token)", {
                        token: "text",
                    })
                    .getOne()
                expect(loadedPost1).to.be.exist

                const loadedPost2 = await postRepository
                    .createQueryBuilder("post")
                    .where("MATCH(post.default) AGAINST (:token)", {
                        token: "te",
                    })
                    .getOne()
                expect(loadedPost2).to.be.null
            }),
        ))

    it("with ngram parser", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const text = "This is text"
                const post = new Post()
                post.default = text
                post.ngram = text
                await postRepository.save(post)

                const loadedPost1 = await postRepository
                    .createQueryBuilder("post")
                    .where("MATCH(post.ngram) AGAINST (:token)", {
                        token: "text",
                    })
                    .getOne()
                expect(loadedPost1).to.be.exist

                const loadedPost2 = await postRepository
                    .createQueryBuilder("post")
                    .where("MATCH(post.ngram) AGAINST (:token)", {
                        token: "te",
                    })
                    .getOne()
                expect(loadedPost2).to.be.exist
            }),
        ))
})
