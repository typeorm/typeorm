import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DocumentChunk } from "./entity/DocumentChunk"
import { Point } from "./entity/Point"

describe("columns > vector type > sqlserver", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [DocumentChunk, Point],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create vector column with specified dimensions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("document_chunk")
                await queryRunner.release()

                const embeddingColumn = table!.findColumnByName("embedding")

                expect(embeddingColumn).to.exist
                expect(embeddingColumn!.type).to.equal("vector")
                // NOTE: real returned length is (N*4 + 8) where N is desired dimensions
                expect(embeddingColumn!.length).to.equal("8000")
            }),
        ))

    it("should persist and hydrate vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(DocumentChunk)

                const embedding = Array.from({ length: 1998 }, () =>
                    Math.random(),
                )

                const chunk = new DocumentChunk()
                chunk.content = "Test content"
                chunk.embedding = embedding

                await repository.save(chunk)

                const loadedChunk = await repository.findOne({
                    where: { id: chunk.id },
                })

                expect(loadedChunk).to.exist
                expect(loadedChunk!.embedding).to.be.an("array")
                expect(loadedChunk!.embedding).to.have.lengthOf(1998)

                // Check that values are close (floating point comparison)
                loadedChunk!.embedding.forEach((val, idx) => {
                    expect(val).to.be.closeTo(embedding[idx], 0.0001)
                })
            }),
        ))

    it("should update vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(Point)

                const point = new Point()
                point.name = "Test Point"
                point.coords = [1.0, 2.0, 3.0]

                await repository.save(point)

                point.coords = [4.0, 5.0, 6.0]
                await repository.save(point)

                const loadedPoint = await repository.findOne({
                    where: { id: point.id },
                })

                expect(loadedPoint).to.exist
                expect(loadedPoint!.coords).to.deep.equal([4.0, 5.0, 6.0])
            }),
        ))

    it("should perform cosine similarity search using VECTOR_DISTANCE", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(DocumentChunk)
                const baseEmbedding = Array.from({ length: 1998 }, () =>
                    Math.random(),
                )

                // Create test data with known vectors
                const embeddings = [
                    {
                        content: "Similar chunk",
                        embedding: [1.0, 1.0, 1.0, ...baseEmbedding.slice(3)],
                    },
                    {
                        content: "Also similar",
                        embedding: [1.0, 1.0, 1.1, ...baseEmbedding.slice(3)],
                    },
                    {
                        content: "Very different",
                        embedding: [
                            10.0,
                            10.0,
                            10.0,
                            ...baseEmbedding.slice(3),
                        ],
                    },
                ]

                await repository.save(embeddings)

                const query = [1.0, 1.0, 1.05, ...baseEmbedding.slice(3)]

                const results = await connection.query(
                    `
                    DECLARE @query AS VECTOR (1998) = '${JSON.stringify(
                        query,
                    )}';
                    SELECT TOP (2) *, VECTOR_DISTANCE('cosine', @query, embedding) AS distance
                    FROM document_chunk
                    ORDER BY VECTOR_DISTANCE('cosine', @query, embedding)
                    `,
                )

                expect(results.length).to.equal(2)
                // The first two results should be the similar ones
                expect(results[0].content).to.be.oneOf([
                    "Similar chunk",
                    "Also similar",
                ])
                expect(results[1].content).to.be.oneOf([
                    "Similar chunk",
                    "Also similar",
                ])
                // Distance should be small for similar vectors
                expect(results[0].distance).to.be.lessThan(0.1)
            }),
        ))

    it("should perform euclidean distance search using VECTOR_DISTANCE", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(Point)

                // Create test data with known vectors
                const points = [
                    {
                        name: "Nearest point",
                        coords: [1.0, 1.0, 1.0],
                    },
                    {
                        name: "Also near",
                        coords: [1.0, 1.0, 1.1],
                    },
                    {
                        name: "Very different",
                        coords: [10.0, 10.0, 10.0],
                    },
                ]

                await repository.save(points)

                const origin = [1.0, 1.0, 1.05]

                const results = await connection.query(
                    `
                    DECLARE @origin AS VECTOR (3) = '${JSON.stringify(origin)}';
                    SELECT TOP (2) *, VECTOR_DISTANCE('euclidean', @origin, coords) AS distance
                    FROM point
                    ORDER BY VECTOR_DISTANCE('euclidean', @origin, coords)
                    `,
                )

                expect(results.length).to.equal(2)
                // The first two results should be the similar ones
                expect(results[0].name).to.be.oneOf([
                    "Nearest point",
                    "Also near",
                ])
                expect(results[1].name).to.be.oneOf([
                    "Nearest point",
                    "Also near",
                ])
                // Distance should be small for similar vectors
                expect(results[0].distance).to.be.lessThan(0.1)
            }),
        ))

    it("should handle null vector values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(DocumentChunk)

                const chunk = new DocumentChunk()
                chunk.content = "No embedding"
                chunk.embedding = null as any
                chunk.documentId = "doc-789"

                await repository.save(chunk)

                const loadedChunk = await repository.findOne({
                    where: { id: chunk.id },
                })

                expect(loadedChunk).to.exist
                expect(loadedChunk!.embedding).to.be.null
            }),
        ))
})
