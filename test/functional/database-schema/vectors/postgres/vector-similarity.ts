import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("columns > vector type > similarity operations", () => {
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

    async function setupTestData(connection: DataSource) {
        const postRepository = connection.getRepository(Post)
        await postRepository.clear() // Clear existing data

        // Create test posts with known vectors
        const posts = await postRepository.save([
            { embedding: [1, 1, 1] },
            { embedding: [1, 1, 2] },
            { embedding: [5, 5, 5] },
            { embedding: [2, 2, 2] },
            { embedding: [-1, -1, -1] },
        ])

        return posts
    }

    it("should perform similarity search using L2 distance", () =>
        Promise.all(
            connections.map(async (connection) => {
                await setupTestData(connection)
                const queryVector = "[1,1,1.6]" // Search vector

                const results = await connection.query(
                    `SELECT id, embedding FROM "post" ORDER BY embedding <-> $1 LIMIT 2`,
                    [queryVector],
                )

                expect(results.length).to.equal(2)
                // [1,1,2] should be closest to [1,1,1.6], then [1,1,1]
                expect(results[0].embedding).to.deep.equal("[1,1,2]")
                expect(results[1].embedding).to.deep.equal("[1,1,1]")
            }),
        ))

    it("should perform similarity search using cosine distance", () =>
        Promise.all(
            connections.map(async (connection) => {
                await setupTestData(connection)
                const queryVector = "[1,1,1]" // Search vector

                const results = await connection.query(
                    `SELECT id, embedding FROM "post" ORDER BY embedding <=> $1 LIMIT 3`,
                    [queryVector],
                )

                expect(results.length).to.equal(3)
                // [1,1,1] and [2,2,2] should have cosine distance 0 (same direction)
                // [-1,-1,-1] should be last (opposite direction)
                const embeddings = results.map(
                    (r: { embedding: string }) => r.embedding, // Ensure type is string for raw results
                )
                expect(embeddings).to.deep.include.members([
                    "[1,1,1]",
                    "[2,2,2]",
                ])
                expect(embeddings).to.not.deep.include("[-1,-1,-1]")
            }),
        ))

    it("should perform similarity search using inner product", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                await postRepository.clear()

                // Create vectors with known inner products
                await postRepository.save([
                    { embedding: [1, 2, 3] }, // IP with [1,1,1] = 6
                    { embedding: [3, 3, 3] }, // IP with [1,1,1] = 9
                    { embedding: [-1, 0, 1] }, // IP with [1,1,1] = 0
                ])

                const queryVector = "[1,1,1]" // Search vector

                const results = await connection.query(
                    `SELECT id, embedding FROM "post" ORDER BY embedding <#> $1 ASC LIMIT 2`, // The <#> operator returns negative inner product, so ASC ordering gives highest positive inner product first (most similar vectors)
                    [queryVector],
                )

                expect(results.length).to.equal(2)
                // [3,3,3] should have highest inner product, then [1,2,3]
                expect(results[0].embedding).to.deep.equal("[3,3,3]")
                expect(results[1].embedding).to.deep.equal("[1,2,3]")
            }),
        ))

    it("should prevent persistence of Post with incorrect vector dimensions due to DB constraints", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                post.embedding_three_dimensions = [1, 1] // Wrong dimensions (2 instead of 3)

                let saveThrewError = false
                try {
                    await postRepository.save(post)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    saveThrewError = true
                }

                expect(saveThrewError).to.be.true
                expect(post.id).to.be.undefined

                const foundPostWithMalformedEmbedding = await connection
                    .getRepository(Post)
                    .createQueryBuilder("p")
                    .where(
                        "p.embedding_three_dimensions::text = :embeddingText",
                        {
                            embeddingText: "[1,1]",
                        },
                    )
                    .getOne()
                expect(foundPostWithMalformedEmbedding).to.be.null
            }),
        ))

    it("should perform halfvec similarity search using L2 distance", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                await postRepository.clear()

                // Create test posts with known halfvec values
                await postRepository.save([
                    { halfvec_four_dimensions: [1, 1, 1, 1] },
                    { halfvec_four_dimensions: [1, 1, 2, 2] },
                    { halfvec_four_dimensions: [5, 5, 5, 5] },
                    { halfvec_four_dimensions: [2, 2, 2, 2] },
                ])

                const queryVector = "[1,1,1.5,1.5]" // Search vector

                const results = await connection.query(
                    `SELECT id, halfvec_four_dimensions FROM "post" ORDER BY halfvec_four_dimensions <-> $1 LIMIT 2`,
                    [queryVector],
                )

                expect(results.length).to.equal(2)
                // [1,1,2,2] should be closest to [1,1,1.5,1.5], then [1,1,1,1]
                expect(results[0].halfvec_four_dimensions).to.deep.equal(
                    "[1,1,2,2]",
                )
                expect(results[1].halfvec_four_dimensions).to.deep.equal(
                    "[1,1,1,1]",
                )
            }),
        ))

    it("should prevent persistence of Post with incorrect halfvec dimensions due to DB constraints", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const post = new Post()
                post.halfvec_four_dimensions = [1, 1, 1] // Wrong dimensions (3 instead of 4)

                let saveThrewError = false
                try {
                    await postRepository.save(post)
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    saveThrewError = true
                }

                expect(saveThrewError).to.be.true
                expect(post.id).to.be.undefined

                const foundPostWithMalformedHalfvec = await connection
                    .getRepository(Post)
                    .createQueryBuilder("p")
                    .where("p.halfvec_four_dimensions::text = :embeddingText", {
                        embeddingText: "[1,1,1]",
                    })
                    .getOne()
                expect(foundPostWithMalformedHalfvec).to.be.null
            }),
        ))
})
