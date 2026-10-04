import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { AuroraPostgresDriver } from "../../../src/driver/aurora-postgres/AuroraPostgresDriver"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"
import { TableForeignKey } from "../../../src/schema-builder/table/TableForeignKey"

describe("PostgreSQL dialect compatibility", () => {
    const postgres = new PostgresDriver()
    const cockroach = Object.assign(
        Object.create(CockroachDriver.prototype) as CockroachDriver,
        { parametersPrefix: "$" },
    )

    for (const [name, driver] of [
        ["PostgreSQL", postgres],
        ["CockroachDB", cockroach],
    ] as const) {
        describe(name, () => {
            it("binds repeated, array and function parameters in order", () => {
                expect(
                    driver.escapeQueryWithParameters(
                        "a = :value OR b = :value AND c IN (:...ids) AND d = :now AND e = :missing",
                        {
                            value: 7,
                            ids: [8, 9],
                            now: () => "CURRENT_TIMESTAMP",
                        },
                    ),
                ).to.deep.equal([
                    "a = $1 OR b = $1 AND c IN ($2, $3) AND d = CURRENT_TIMESTAMP AND e = :missing",
                    [7, 8, 9],
                ])
            })

            it("escapes identifiers and respects explicit schema metadata", () => {
                driver.database = "app"
                driver.schema = "public"
                expect(driver.escape('a"b')).to.equal('"a""b"')
                expect(driver.buildTableName("items", "tenant")).to.equal(
                    "tenant.items",
                )
                expect(driver.parseTableName("items")).to.deep.equal({
                    database: "app",
                    schema: "public",
                    tableName: "items",
                })
                expect(
                    driver.parseTableName(new Table({ name: "tenant.items" })),
                ).to.deep.equal({
                    database: "app",
                    schema: "tenant",
                    tableName: "items",
                })
                expect(
                    driver.parseTableName(
                        new TableForeignKey({
                            columnNames: ["id"],
                            referencedColumnNames: ["id"],
                            referencedTableName: "tenant.items",
                            referencedSchema: "override",
                        }),
                    ),
                ).to.deep.equal({
                    database: "app",
                    schema: "override",
                    tableName: "items",
                })
            })

            it("preserves literal JSON and boolean defaults", () => {
                expect(
                    driver.normalizeDefault({
                        type: "jsonb",
                        default: { label: "it's" },
                    } as unknown as ColumnMetadata),
                ).to.equal(`'{"label":"it''s"}'`)
                expect(
                    driver.normalizeDefault({
                        type: Boolean,
                        default: false,
                    } as ColumnMetadata),
                ).to.equal("false")
                expect(
                    driver.normalizeDefault({
                        default: null,
                    } as ColumnMetadata),
                ).to.equal(undefined)
            })
        })
    }

    it("keeps database-specific type and numeric default semantics", () => {
        expect(postgres.normalizeType({ type: Number })).to.equal("integer")
        expect(cockroach.normalizeType({ type: Number })).to.equal("int8")
        expect(postgres.normalizeType({ type: "json" })).to.equal("json")
        expect(cockroach.normalizeType({ type: "json" })).to.equal("jsonb")
        const column = { type: Number, default: 42 } as ColumnMetadata
        expect(postgres.normalizeDefault(column)).to.equal("'42'")
        expect(cockroach.normalizeDefault(column)).to.equal("(42)")
        expect(
            postgres.createFullType(
                new TableColumn({
                    name: "embedding",
                    type: "vector",
                    length: "3",
                }),
            ),
        ).to.equal("vector(3)")
    })

    it("constructs Aurora with its supplied native client without loading pg", () => {
        class DataApiClient {}
        const load = sinon
            .stub(PlatformTools, "load")
            .throws(new Error("unexpected package load"))
        try {
            const source = new DataSource({
                type: "aurora-postgres",
                database: "app",
                region: "test",
                secretArn: "secret",
                resourceArn: "resource",
                driver: { pg: DataApiClient },
            })
            expect(source.driver).to.be.instanceOf(AuroraPostgresDriver)
            expect(source.driver.normalizeType({ type: Number })).to.equal(
                "integer",
            )
            expect(load.called).to.equal(false)
        } finally {
            load.restore()
        }
    })
})
