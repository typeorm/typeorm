# Vector Type Support in SQL Server

This sample demonstrates how to use the `vector` column type in SQL Server with TypeORM for storing and querying vector embeddings.

## Overview

SQL Server supports the `vector` data type for storing high-dimensional vectors, which is useful for:

-   Semantic search with embeddings
-   Recommendation systems
-   Similarity matching
-   Machine learning applications

## Features Demonstrated

1. **Vector Column Definition**: Define columns with specific vector dimensions
2. **Storing Embeddings**: Save vector data as arrays of numbers
3. **Vector Similarity Search**: Use `VECTOR_DISTANCE` function for cosine similarity

## Entity Definition

```typescript
@Entity("document_chunks")
export class DocumentChunk {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: "MAX" })
    content: string

    // Vector column with 1998 dimensions
    @Column("vector", { length: 1998 })
    embedding: number[]

    @Column("uuid")
    documentId: string

    @ManyToOne(() => Document, (document) => document.chunks)
    @JoinColumn({ name: "documentId" })
    document: Document
}
```

## Vector Similarity Search

SQL Server provides the `VECTOR_DISTANCE` function for calculating distances between vectors:

```typescript
const queryEmbedding = [
    /* your query vector */
]
const documentIds = ["doc-id-1", "doc-id-2"]

const results = await connection.query(
    `
    DECLARE @question AS VECTOR (1998) = @0;
    SELECT TOP (10) dc.*, 
           VECTOR_DISTANCE('cosine', @question, embedding) AS distance,
           d.fileName as "documentName"
    FROM document_chunks dc
    LEFT JOIN documents d ON dc.documentId = d.id
    WHERE documentId IN (@1))
    ORDER BY VECTOR_DISTANCE('cosine', @question, embedding)
`,
    [JSON.stringify(queryEmbedding), documentIds.join(", ")],
)
```

## Distance Metrics

The `VECTOR_DISTANCE` function supports different distance metrics:

-   `'cosine'` - Cosine distance (most common for semantic search)
-   `'euclidean'` - Euclidean (L2) distance
-   `'dot'` - Negative dot product

## Requirements

-   SQL Server with vector support enabled
-   TypeORM with SQL Server driver (`mssql` package)

## Running the Sample

1. Make sure you have SQL Server running with vector support
2. Update the connection settings in `app.ts` if needed
3. Run:
    ```bash
    npm install
    ts-node app.ts
    ```

## Notes

-   Vector dimensions must be specified using the `length` option
-   Embeddings are stored as JSON strings internally and converted to/from arrays automatically
-   The maximum vector dimension depends on your SQL Server version and configuration
