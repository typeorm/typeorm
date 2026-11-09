import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("query runner > load tables", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb"],
            entities: [],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should keep the catalog rows of same-named tables in different schemas apart", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await using queryRunner = dataSource.createQueryRunner()
                const schemas = ["load_tables_a", "load_tables_b"]

                for (const schema of schemas) {
                    await queryRunner.query(
                        `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
                    )
                    await queryRunner.query(`CREATE SCHEMA "${schema}"`)
                    await queryRunner.query(
                        `CREATE TABLE "${schema}"."parent" ("id" int PRIMARY KEY)`,
                    )
                    await queryRunner.query(
                        `CREATE TABLE "${schema}"."item" (
                            "id" int PRIMARY KEY,
                            "parent_id" int,
                            "${schema}_only" int,
                            CONSTRAINT "FK_${schema}" FOREIGN KEY ("parent_id")
                                REFERENCES "${schema}"."parent" ("id")
                        )`,
                    )
                    await queryRunner.query(
                        `CREATE INDEX "IDX_${schema}" ON "${schema}"."item" ("${schema}_only")`,
                    )
                }

                const tables = await queryRunner.getTables(
                    schemas.map((schema) => `${schema}.item`),
                )

                for (const schema of schemas) {
                    const table = tables.find(
                        (loaded) => loaded.name === `${schema}.item`,
                    )!

                    expect(table.columns.map((c) => c.name)).to.have.members([
                        "id",
                        "parent_id",
                        `${schema}_only`,
                    ])
                    expect(table.foreignKeys.map((fk) => fk.name)).to.eql([
                        `FK_${schema}`,
                    ])
                    expect(table.indices.map((i) => i.name)).to.include(
                        `IDX_${schema}`,
                    )
                    expect(table.indices.map((i) => i.name)).to.not.include(
                        `IDX_${schemas.find((other) => other !== schema)}`,
                    )
                }

                for (const schema of schemas) {
                    await queryRunner.query(`DROP SCHEMA "${schema}" CASCADE`)
                }
            }),
        ))
})
