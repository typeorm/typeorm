import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Sparsevec } from "../../../../../src"

describe("columns > vector type > postgres", () => {
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
                const sparse_embedding = new Sparsevec({
                    1: 1.0,
                    5: 2.0,
                    2: 3.0,
                })
                const bit_vector = "1010101010101010"

                const post = new Post()
                post.embedding = embedding
                post.embedding_three_dimensions = embedding_three_dimensions
                post.halfvec_embedding = halfvec_embedding
                post.halfvec_four_dimensions = halfvec_four_dimensions
                post.sparse_embedding = sparse_embedding
                post.bit_vector = bit_vector

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
                expect(loadedPost!.sparse_embedding).to.exist
                expect(loadedPost!.bit_vector).to.equal(bit_vector)

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
                    .findColumnByName("sparse_embedding")!
                    .type.should.be.equal("sparsevec")
                table!
                    .findColumnByName("sparse_embedding")!
                    .length!.should.be.equal("5")
                table!
                    .findColumnByName("bit_vector")!
                    .type.should.be.equal("bit")
                table!
                    .findColumnByName("bit_vector")!
                    .length!.should.be.equal("16")
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

    it("should handle different sparsevec input formats", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // Test with Map
                const postWithMap = new Post()
                postWithMap.sparse_embedding = new Map([
                    [1, 1.0],
                    [5, 2.0],
                    [2, 3.0],
                ])
                await postRepository.save(postWithMap)

                let loadedPost = await postRepository.findOne({
                    where: { id: postWithMap.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist

                // Test with Record
                const postWithRecord = new Post()
                postWithRecord.sparse_embedding = { 1: 1.5, 5: 2.5, 2: 3.5 }
                await postRepository.save(postWithRecord)

                loadedPost = await postRepository.findOne({
                    where: { id: postWithRecord.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist

                // Test with array
                const postWithArray = new Post()
                postWithArray.sparse_embedding = [0, 1.0, 0, 0, 2.0]
                await postRepository.save(postWithArray)

                loadedPost = await postRepository.findOne({
                    where: { id: postWithArray.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist

                // Test with string
                const postWithString = new Post()
                postWithString.sparse_embedding = "{1:1.0,5:2.0,2:3.0}/5"
                await postRepository.save(postWithString)

                loadedPost = await postRepository.findOne({
                    where: { id: postWithString.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist

                // Test with Sparsevec instance
                const postWithSparsevec = new Post()
                postWithSparsevec.sparse_embedding = new Sparsevec({
                    1: 1.5,
                    5: 2.5,
                    2: 3.5,
                })
                await postRepository.save(postWithSparsevec)

                loadedPost = await postRepository.findOne({
                    where: { id: postWithSparsevec.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist
            }),
        ))

    it("should handle nullable sparsevec", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.sparse_embedding = null

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.be.null
            }),
        ))

    it("should update sparsevec with different formats", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.sparse_embedding = new Sparsevec({ 1: 1.0, 5: 2.0 })

                await postRepository.save(post)

                // Update with Map
                post.sparse_embedding = new Map([
                    [2, 2.0],
                    [5, 4.0],
                ])
                await postRepository.save(post)

                let loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist

                // Update with Record
                post.sparse_embedding = { 3: 3.0, 5: 6.0 }
                await postRepository.save(post)

                loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist

                // Update to null
                post.sparse_embedding = null
                await postRepository.save(post)

                loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.be.null
            }),
        ))
})
