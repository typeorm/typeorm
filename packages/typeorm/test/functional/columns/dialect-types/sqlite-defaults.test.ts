import "reflect-metadata"

import { expect } from "chai"

import { DataSource } from "../../../../src"
import { EntitySchema } from "../../../../src/entity-schema/EntitySchema"

describe("columns > dialect types > SQLite defaults", () => {
    it("should insert an omitted JSON default using its physical text type", async () => {
        const entity = new EntitySchema({
            name: "DialectJsonDefault",
            columns: {
                id: { type: Number, primary: true },
                payload: {
                    type: "jsonb",
                    default: { answer: 42 },
                    dialectTypes: { "better-sqlite3": "text" },
                },
            },
        })
        const dataSource = new DataSource({
            type: "better-sqlite3",
            database: ":memory:",
            entities: [entity],
            synchronize: true,
        })
        await dataSource.initialize()
        try {
            const repository = dataSource.getRepository(entity)
            await repository.insert({ id: 1 })
            const rows = await dataSource.query(
                'SELECT typeof("payload") AS storage_class, "payload" FROM "dialect_json_default" WHERE "id" = 1',
            )
            expect(rows[0].storage_class).to.equal("text")
            expect(JSON.parse(rows[0].payload)).to.deep.equal({ answer: 42 })
            expect(
                (await repository.findOneByOrFail({ id: 1 })).payload,
            ).to.deep.equal({ answer: 42 })

            const queries = await dataSource.driver.createSchemaBuilder().log()
            expect(queries.upQueries).to.be.empty
            expect(queries.downQueries).to.be.empty
        } finally {
            await dataSource.destroy()
        }
    })
})
