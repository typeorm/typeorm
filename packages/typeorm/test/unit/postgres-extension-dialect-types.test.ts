import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import type { ColumnOptions } from "../../src/decorator/options/ColumnOptions"
import type { PostgresDriver } from "../../src/driver/postgres/PostgresDriver"
import { ColumnMetadata } from "../../src/metadata/ColumnMetadata"
import { EntityMetadata } from "../../src/metadata/EntityMetadata"

describe("PostgresDriver > extension detection for dialect types", () => {
    // The client stub avoids loading the optional PostgreSQL dependency. The
    // connection methods are recorded below, so this test never reaches a DB.
    const dataSource = new DataSource({ type: "postgres", driver: {} })
    const driver = dataSource.driver as PostgresDriver
    const entityMetadata = new EntityMetadata({
        dataSource,
        args: { target: "ExtensionColumns", type: "regular" },
    })

    function createColumn(
        propertyName: string,
        options: ColumnOptions,
    ): ColumnMetadata {
        const column = new ColumnMetadata({
            entityMetadata,
            args: {
                target: "ExtensionColumns",
                propertyName,
                mode: "regular",
                options,
            },
        })
        column.databaseName = propertyName
        return column
    }

    it("installs extensions required by physical column types after metadata is built", async () => {
        const columns = [
            createColumn("caseInsensitive", {
                type: String,
                dialectTypes: { postgres: "citext" },
            }),
            createColumn("properties", {
                type: "json",
                dialectTypes: { postgres: "hstore" },
            }),
            createColumn("coordinates", {
                type: "varchar",
                dialectTypes: { postgres: "cube" },
            }),
            createColumn("shape", {
                type: "varchar",
                dialectTypes: { postgres: "geometry" },
            }),
            createColumn("path", {
                type: "varchar",
                dialectTypes: { postgres: "ltree" },
            }),
            createColumn("embedding", {
                type: "varchar",
                dialectTypes: { postgres: "vector(3)" },
            }),
            createColumn("compactEmbedding", {
                type: "varchar",
                dialectTypes: { postgres: "halfvec(3)" },
            }),
            createColumn("externalId", {
                type: "varchar",
                dialectTypes: { postgres: "uuid" },
            }),
        ]
        entityMetadata.columns = columns
        Object.assign(dataSource, { entityMetadatas: [entityMetadata] })

        const queries: string[] = []
        Object.assign(driver, {
            version: "17.0",
            obtainMasterConnection: () =>
                Promise.resolve([{}, () => Promise.resolve()]),
            executeQuery: (_connection: unknown, query: string) => {
                queries.push(query)
                return Promise.resolve()
            },
        })

        await driver.afterConnect()

        expect(queries).to.deep.equal([
            'CREATE EXTENSION IF NOT EXISTS "citext"',
            'CREATE EXTENSION IF NOT EXISTS "hstore"',
            'CREATE EXTENSION IF NOT EXISTS "postgis"',
            'CREATE EXTENSION IF NOT EXISTS "cube"',
            'CREATE EXTENSION IF NOT EXISTS "ltree"',
            'CREATE EXTENSION IF NOT EXISTS "vector"',
        ])
        expect(queries).not.to.include(
            'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
        )
        expect(columns.map((column) => column.type)).to.deep.equal([
            String,
            "json",
            "varchar",
            "varchar",
            "varchar",
            "varchar",
            "varchar",
            "varchar",
        ])
    })
})
