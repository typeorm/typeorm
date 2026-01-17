import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

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
                const sparse_embedding = "{1:1.0,5:2.0,2:3.0}/5"
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

    it("should fail when incorrect syntax for sparsevec as string is used", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.sparse_embedding = "{1:1.5,5:2.3,10:3.7-20" // Missing closing brace

                await expect(postRepository.save(post)).to.be.rejectedWith(
                    Error,
                    /invalid input syntax for type sparsevec/,
                )

                post.sparse_embedding = "{1:1.5,5:2.3,10:3.7}/abc" // Non-numeric dimensions

                await expect(postRepository.save(post)).to.be.rejectedWith(
                    Error,
                    /invalid input syntax for type sparsevec/,
                )

                post.sparse_embedding = "1:1.5,5:2.3,10:3.7}/20" // Missing opening brace

                await expect(postRepository.save(post)).to.be.rejectedWith(
                    Error,
                    /invalid input syntax for type sparsevec/,
                )

                post.sparse_embedding = "{1:1.5,5:2.3,10:3.7}" // Missing dimensions
                await expect(postRepository.save(post)).to.be.rejectedWith(
                    Error,
                    /invalid input syntax for type sparsevec/,
                )

                post.sparse_embedding = {
                    values: { 1: 1.5, 5: 2.3, 10: 3.7 },
                    length: 200,
                } // Dimensions exceed length

                await expect(postRepository.save(post)).to.be.rejectedWith(
                    Error,
                    /expected 5 dimensions, not 200/,
                )
            }),
        ))

    it("should update vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.embedding = [1.0, 2.0]
                post.embedding_three_dimensions = [3.0, 4.0, 5.0]
                post.halfvec_embedding = [1.5, 2.5]
                post.halfvec_four_dimensions = [3.5, 4.5, 5.5, 6.5]
                post.sparse_embedding = { values: { 1: 1.0, 5: 2.0, 2: 3.0 } } // No length provided will use the length from column definition

                await postRepository.save(post)

                post.embedding = [5.0, 6.0]
                post.embedding_three_dimensions = [7.0, 8.0, 9.0]
                post.sparse_embedding = { values: { 2: 2.5, 4: 4.5 } }

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.embedding).to.deep.equal([5.0, 6.0])
                expect(loadedPost!.embedding_three_dimensions).to.deep.equal([
                    7.0, 8.0, 9.0,
                ])
                expect(loadedPost!.sparse_embedding).to.exist
                expect(loadedPost!.sparse_embedding).to.deep.equal({
                    values: { 2: 2.5, 4: 4.5 },
                    length: 5,
                })
            }),
        ))

    it("should handle different sparsevec input formats", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // Test with string
                const postWithString = new Post()
                postWithString.sparse_embedding = "{1:1.0,5:2.0,2:3.0}/5"
                await postRepository.save(postWithString)

                let loadedPost = await postRepository.findOne({
                    where: { id: postWithString.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist
                expect(loadedPost!.sparse_embedding).to.deep.equal({
                    values: { 1: 1.0, 5: 2.0, 2: 3.0 },
                    length: 5,
                })

                // Test with SparseVector object
                const postWithSparsevec = new Post()
                postWithSparsevec.sparse_embedding = {
                    values: { 1: 1.5, 3: 3.5, 5: 2.5, 2: -87.63 },
                    length: 5,
                }
                await postRepository.save(postWithSparsevec)

                loadedPost = await postRepository.findOne({
                    where: { id: postWithSparsevec.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist
                expect(loadedPost!.sparse_embedding).to.deep.equal({
                    values: { 1: 1.5, 3: 3.5, 5: 2.5, 2: -87.63 },
                    length: 5,
                })
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

                // Update with string
                post.sparse_embedding = "{2:2.0,4:4.0}/5"
                await postRepository.save(post)

                let loadedPost = await postRepository.findOne({
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

                // Update with SparseVector object
                post.sparse_embedding = {
                    values: { 2: 2.5, 4: 4.5 },
                    length: 5,
                }
                await postRepository.save(post)

                loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })
                expect(loadedPost).to.exist
                expect(loadedPost!.sparse_embedding).to.exist
            }),
        ))
})
