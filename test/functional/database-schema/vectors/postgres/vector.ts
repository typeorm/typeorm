import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("columns > vector type", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create vector column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const embedding = [1.0, 2.0, 3.0]
                const embedding_three_dimensions = [1.0, 2.0, 3.0]
                const halfvec_embedding = [1.5, 2.5]
                const halfvec_four_dimensions = [1.5, 2.5, 3.5, 4.5]

                const post = new Post()
                post.embedding = embedding
                post.embedding_three_dimensions = embedding_three_dimensions
                post.halfvec_embedding = halfvec_embedding
                post.halfvec_four_dimensions = halfvec_four_dimensions

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.embedding).to.deep.equal(embedding)
                expect(loadedPost!.embedding_three_dimensions).to.deep.equal(
                    embedding_three_dimensions,
                )
                expect(loadedPost!.halfvec_embedding).to.deep.equal(
                    halfvec_embedding,
                )
                expect(loadedPost!.halfvec_four_dimensions).to.deep.equal(
                    halfvec_four_dimensions,
                )

                table!
                    .findColumnByName("embedding")!
                    .type.should.be.equal("vector")
                table!
                    .findColumnByName("embedding_three_dimensions")!
                    .type.should.be.equal("vector")
                table!
                    .findColumnByName("embedding_three_dimensions")!
                    .length!.should.be.equal("3")
                table!
                    .findColumnByName("halfvec_embedding")!
                    .type.should.be.equal("halfvec")
                table!
                    .findColumnByName("halfvec_four_dimensions")!
                    .type.should.be.equal("halfvec")
                table!
                    .findColumnByName("halfvec_four_dimensions")!
                    .length!.should.be.equal("4")
            }),
        ))

    it("should update vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.embedding = [1.0, 2.0]
                post.embedding_three_dimensions = [3.0, 4.0, 5.0]

                await postRepository.save(post)

                post.embedding = [5.0, 6.0]
                post.embedding_three_dimensions = [7.0, 8.0, 9.0]

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.embedding).to.deep.equal([5.0, 6.0])
                expect(loadedPost!.embedding_three_dimensions).to.deep.equal([
                    7.0, 8.0, 9.0,
                ])
            }),
        ))
})
