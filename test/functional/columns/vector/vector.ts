import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
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

        // Install pgvector extension
        await Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                try {
                    await queryRunner.query(
                        "CREATE EXTENSION IF NOT EXISTS vector",
                    )
                } catch (error) {
                    console.warn(
                        "Could not create vector extension. Tests may fail if pgvector is not installed.",
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        )
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
                const embeddings = [
                    [1.0, 2.0],
                    [3.0, 4.0],
                ]

                const post = new Post()
                post.embedding = embedding
                post.embeddings = embeddings

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.embedding).to.deep.equal(embedding)
                expect(loadedPost!.embeddings).to.deep.equal(embeddings)

                table!
                    .findColumnByName("embedding")!
                    .type.should.be.equal("vector")
                table!
                    .findColumnByName("embeddings")!
                    .type.should.be.equal("vector")
                table!.findColumnByName("embeddings")!.isArray.should.be.true
            }),
        ))

    it("should handle null and empty vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.embedding = []
                post.embeddings = []

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.embedding).to.deep.equal([])
                expect(loadedPost!.embeddings).to.deep.equal([])
            }),
        ))

    it("should update vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post = new Post()
                post.embedding = [1.0, 2.0]
                post.embeddings = [[3.0, 4.0]]

                await postRepository.save(post)

                post.embedding = [5.0, 6.0]
                post.embeddings = [
                    [7.0, 8.0],
                    [9.0, 10.0],
                ]

                await postRepository.save(post)

                const loadedPost = await postRepository.findOne({
                    where: { id: post.id },
                })

                expect(loadedPost).to.exist
                expect(loadedPost!.embedding).to.deep.equal([5.0, 6.0])
                expect(loadedPost!.embeddings).to.deep.equal([
                    [7.0, 8.0],
                    [9.0, 10.0],
                ])
            }),
        ))
})
