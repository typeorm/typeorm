import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntitySchema } from "../../../src/entity-schema/EntitySchema"
import { EntitySchemaTransformer } from "../../../src/entity-schema/EntitySchemaTransformer"
import { EntityMetadataBuilder } from "../../../src/metadata-builder/EntityMetadataBuilder"

// https://github.com/typeorm/typeorm/issues/10130
describe("EntitySchemaTransformer > view schema", () => {
    const expression = `SELECT 1 AS "id"`

    const createViewSchema = (materialized?: boolean) =>
        new EntitySchema({
            name: "PostView",
            type: "view",
            expression,
            materialized,
            columns: {
                id: { type: Number },
            },
        })

    it("should mark the view as materialized", () => {
        const { tables } = new EntitySchemaTransformer().transform([
            createViewSchema(true),
        ])

        expect(tables).to.have.length(1)
        expect(tables[0]).to.include({
            type: "view",
            expression,
            materialized: true,
        })
    })

    it("should not mark the view as materialized by default", () => {
        const { tables } = new EntitySchemaTransformer().transform([
            createViewSchema(),
        ])

        expect(tables).to.have.length(1)
        expect(tables[0]).to.include({
            type: "view",
            expression,
            materialized: false,
        })
    })

    it("should build entity metadata of a materialized view", () => {
        const dataSource = new DataSource({ type: "postgres" })
        const metadataArgsStorage = new EntitySchemaTransformer().transform([
            createViewSchema(true),
        ])

        const [metadata] = new EntityMetadataBuilder(
            dataSource,
            metadataArgsStorage,
        ).build()

        expect(metadata.tableMetadataArgs.materialized).to.equal(true)
    })
})
