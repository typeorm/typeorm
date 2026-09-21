import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { Entity, PrimaryColumn, Column } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

@Entity()
class Post {
    @PrimaryColumn()
    id: number

    @Column({ length: "50" })
    name: string

    @Column({
        type: "varchar",
        length: "100",
        asExpression: "name || ' test'",
        generatedType: "STORED",
    })
    generatedName: string

    @Column({ type: "vector", length: "1536", nullable: true })
    embedding: string
}

describe("github issues > #3357 TypeORM generates destructive migrations on length change", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should output ALTER TABLE instead of DROP COLUMN when changing length and preserve generated columns", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.synchronize(false)
                const postMetadata = dataSource.getMetadata(Post)
                
                // Change scalar column length
                const nameColumn = postMetadata.findColumnWithPropertyName("name")!
                nameColumn.length = "100"

                // Change generated column length
                const generatedColumn = postMetadata.findColumnWithPropertyName("generatedName")!
                generatedColumn.length = "255"

                // Change vector dimension (this should trigger drop/recreate or specific alter path)
                const vectorColumn = postMetadata.findColumnWithPropertyName("embedding")!
                vectorColumn.length = "768"
                
                const sqlInMemory = await dataSource.driver.createSchemaBuilder().log()
                const queries = sqlInMemory.upQueries.map((q) => q.query)
                
                // 1) Assert string length change does not trigger DROP COLUMN for 'name' or 'generatedName'
                const dropScalarQueries = queries.filter((q) => 
                    q.includes("DROP COLUMN") && (q.includes("name") || q.includes("generatedName")) && !q.includes("embedding")
                )
                expect(dropScalarQueries.length).to.equal(0, `Found DROP COLUMN for scalar/generated columns in ${dataSource.options.type}`)
                
                // 2) Assert generated columns retain asExpression
                const alterGeneratedQueries = queries.filter((q) => 
                    q.includes("generatedName") && (q.includes("GENERATED ALWAYS AS") || q.includes("AS ("))
                )
                expect(alterGeneratedQueries.length).to.be.greaterThan(0, `asExpression missing from ALTER for generatedName in ${dataSource.options.type}`)

                // 3) Assert vector column correctly handles the change (since dimension changed, it falls back to recreate in dropColumn block)
                const dropVectorQueries = queries.filter((q) => q.includes("DROP") && q.includes("embedding"))
                expect(dropVectorQueries.length).to.be.greaterThan(0, `Vector dimension change bypassed dialect path in ${dataSource.options.type}`)
            }),
        )
    })
})
