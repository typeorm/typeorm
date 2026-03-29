import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("columns > vector type", () => {
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

    it("should create vector column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const embedding = [1.0, 2.0, 3.0]
                const embedding_three_dimensions = [1.0, 2.0, 3.0]
                const halfvec_embedding = [1.5, 2.5]
                const halfvec_four_dimensions = [1.5, 2.5, 3.5, 4.5]
                const bit_embedding = "10110101"
                const sparse_embedding = "{1:0.5,3:0.7}/5"

                const post = new Post()
                post.embedding = embedding
                post.embedding_three_dimensions = embedding_three_dimensions
                post.halfvec_embedding = halfvec_embedding
                post.halfvec_four_dimensions = halfvec_four_dimensions
                post.bit_embedding = bit_embedding
                post.sparse_embedding = sparse_embedding

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
                expect(loadedPost!.bit_embedding).to.equal(bit_embedding)
                expect(loadedPost!.sparse_embedding).to.equal(sparse_embedding)

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
                table!
                    .findColumnByName("bit_embedding")!
                    .type.should.be.equal("bit")
                table!
                    .findColumnByName("bit_embedding")!
                    .length!.should.be.equal("8")
                table!
                    .findColumnByName("sparse_embedding")!
                    .type.should.be.equal("sparsevec")
                table!
                    .findColumnByName("sparse_embedding")!
                    .length!.should.be.equal("5")
            }),
        ))

    it("should update vector values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

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

    it("should update bit and sparsevec values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                const post = new Post()
                post.bit_embedding = "10101010"
                post.sparse_embedding = "{1:0.5}/5"

                await postRepository.save(post)

                post.bit_embedding = "11001100"
                post.sparse_embedding = "{2:0.3,4:0.9}/5"

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.bit_embedding).to.equal("11001100")
                expect(loadedPost!.sparse_embedding).to.equal("{2:0.3,4:0.9}/5")
            }),
        ))
})
