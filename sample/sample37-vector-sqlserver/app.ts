import "reflect-metadata"
import { DataSource } from "../../src/index"
import { DocumentChunk } from "./entity/DocumentChunk"
import { Document } from "./entity/Document"

const AppDataSource = new DataSource({
    type: "mssql",
    host: "localhost",
    username: "sa",
    password: "Admin12345",
    database: "test",
    synchronize: true,
    logging: false,
    entities: [Document, DocumentChunk],
    options: {
        // Enable trust server certificate for local development
        trustServerCertificate: true,
    },
})

AppDataSource.initialize()
    .then(async (connection) => {
        console.log("Inserting documents and chunks with vector embeddings...")

        // Create a document
        const document = new Document()
        document.fileName = "sample-document.txt"
        await connection.manager.save(document)

        // Generate sample embeddings (in a real app, these would come from an ML model)
        const generateEmbedding = (dimension: number): number[] => {
            return Array.from({ length: dimension }, () => Math.random())
        }

        // Create document chunks with embeddings
        const chunk1 = new DocumentChunk()
        chunk1.content =
            "TypeORM is an ORM that can run in NodeJS and can be used with TypeScript and JavaScript."
        chunk1.embedding = generateEmbedding(1998)
        chunk1.document = document

        const chunk2 = new DocumentChunk()
        chunk2.content =
            "It supports both Active Record and Data Mapper patterns."
        chunk2.embedding = generateEmbedding(1998)
        chunk2.document = document

        const chunk3 = new DocumentChunk()
        chunk3.content =
            "TypeORM supports MySQL, PostgreSQL, MariaDB, SQLite, MS SQL Server, Oracle, and more."
        chunk3.embedding = generateEmbedding(1998)
        chunk3.document = document

        await connection.manager.save([chunk1, chunk2, chunk3])

        console.log("Documents and chunks have been saved!")

        // Perform a vector similarity search
        console.log("\nPerforming vector similarity search...")

        // Query embedding (in a real app, this would be generated from user query)
        const queryEmbedding = generateEmbedding(1998)
        const documentIds = [document.id]

        const results = await connection.query(
            `
            DECLARE @question AS VECTOR (1998) = '${JSON.stringify(
                queryEmbedding,
            )}';
            SELECT TOP (3) dc.*, VECTOR_DISTANCE('cosine', @question, embedding) AS distance, d.fileName as "documentName"
              FROM document_chunks dc
              LEFT JOIN documents d ON dc.documentId = d.id
              WHERE documentId IN (${documentIds
                  .map((s) => `'${s}'`)
                  .join(", ")})
              ORDER BY VECTOR_DISTANCE('cosine', @question, embedding)
        `,
        )

        console.log("Search results (top 3 most similar chunks):")
        results.forEach((result: any, index: number) => {
            console.log(`\n${index + 1}. Distance: ${result.distance}`)
            console.log(`   Content: ${result.content.substring(0, 80)}...`)
            console.log(`   Document: ${result.documentName}`)
        })

        await connection.destroy()
    })
    .catch((error) => console.log(error))
