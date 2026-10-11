import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import { EntitySchema } from "../../src/entity-schema/EntitySchema"
import type { EntitySchemaColumnOptions } from "../../src/entity-schema/EntitySchemaColumnOptions"
import { Entity } from "../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../src/decorator/columns/PrimaryGeneratedColumn"
import { TableUtils } from "../../src/schema-builder/util/TableUtils"
import { TableColumn } from "../../src/schema-builder/table/TableColumn"
import { Table } from "../../src/schema-builder/table/Table"
import { MysqlQueryRunner } from "../../src/driver/mysql/MysqlQueryRunner"
import { PostgresQueryRunner } from "../../src/driver/postgres/PostgresQueryRunner"
import type { MysqlDriver } from "../../src/driver/mysql/MysqlDriver"
import type { PostgresDriver } from "../../src/driver/postgres/PostgresDriver"

class MetadataOnlyDataSource extends DataSource {
    prepareMetadata() {
        return this.buildMetadatas()
    }
}

class InspectMysqlQueryRunner extends MysqlQueryRunner {
    defaultPrecision(table: Table, column: TableColumn, precision: number) {
        return this.isDefaultColumnPrecision(table, column, precision)
    }
    defaultScale(table: Table, column: TableColumn, scale: number) {
        return this.isDefaultColumnScale(table, column, scale)
    }
    defaultLength(table: Table, column: TableColumn, length: string) {
        return this.isDefaultColumnLength(table, column, length)
    }
    declaration(column: TableColumn) {
        return this.buildCreateColumnSql(column, true)
    }
}

class InspectPostgresQueryRunner extends PostgresQueryRunner {
    declaration(table: Table, column: TableColumn) {
        return this.buildCreateColumnSql(table, column)
    }
}

async function fixture(
    engine:
        "mysql" | "mariadb" | "aurora-mysql" | "aurora-postgres" | "postgres",
    options: EntitySchemaColumnOptions,
) {
    const entity = new EntitySchema({
        name: "OverrideModifiers",
        columns: { id: { type: Number, primary: true }, value: options },
    })
    // A client stub and metadata-only setup prevent any network connection.
    const dataSource = new MetadataOnlyDataSource(
        engine === "aurora-mysql" || engine === "aurora-postgres"
            ? {
                  type: engine,
                  database: "test",
                  region: "test",
                  secretArn: "test",
                  resourceArn: "test",
                  driver:
                      engine === "aurora-postgres"
                          ? { pg: class {} }
                          : class {},
                  entities: [entity],
              }
            : {
                  type: engine,
                  database: "test",
                  driver: {},
                  entities: [entity],
              },
    )
    await dataSource.prepareMetadata()
    const metadata = dataSource.getMetadata(entity)
    const column = metadata.findColumnWithPropertyName("value")!
    const physical = column.resolveDriverColumn(dataSource.driver)
    const tableColumn = new TableColumn(
        TableUtils.createTableColumnOptions(column, dataSource.driver),
    )
    const table = new Table({
        name: metadata.tableName,
        columns: [tableColumn],
    })
    expect(dataSource.isInitialized).to.equal(false)
    return { dataSource, column, physical, tableColumn, table }
}

// Regression coverage for the physical modifier review on PR #12884.
describe("ColumnMetadata > dialect type modifier compatibility", () => {
    for (const engine of ["mysql", "mariadb"] as const) {
        for (const override of ["varchar(40)", "integer", "date", "time"]) {
            it(`${engine} removes onUpdate from ${override}`, async () => {
                const f = await fixture(engine, {
                    type: "datetime",
                    onUpdate: "CURRENT_TIMESTAMP",
                    dialectTypes: { [engine]: override },
                })
                const runner = new InspectMysqlQueryRunner(
                    f.dataSource.driver as MysqlDriver,
                    "master",
                )
                expect(f.physical.onUpdate).to.equal(undefined)
                expect(runner.declaration(f.tableColumn)).not.to.contain(
                    "ON UPDATE",
                )
                expect(f.column.type).to.equal("datetime")
                expect(f.column.onUpdate).to.equal("CURRENT_TIMESTAMP")
            })
        }
        for (const override of ["timestamp", "datetime(3)"]) {
            it(`${engine} retains temporal onUpdate for ${override}`, async () => {
                const f = await fixture(engine, {
                    type: "datetime",
                    precision: 3,
                    onUpdate: "CURRENT_TIMESTAMP(3)",
                    dialectTypes: { [engine]: override },
                })
                expect(f.physical.onUpdate).to.equal("CURRENT_TIMESTAMP(3)")
            })
        }
    }

    for (const override of ["varchar(40)", "datetime(3)"]) {
        it(`aurora-mysql filters onUpdate for ${override}`, async () => {
            const f = await fixture("aurora-mysql", {
                type: "datetime",
                precision: 3,
                onUpdate: "CURRENT_TIMESTAMP(3)",
                dialectTypes: { "aurora-mysql": override },
            })
            expect(f.physical.onUpdate).to.equal(
                override === "datetime(3)" ? "CURRENT_TIMESTAMP(3)" : undefined,
            )
            expect(f.column.onUpdate).to.equal("CURRENT_TIMESTAMP(3)")
        })
    }

    for (const engine of ["mysql", "aurora-mysql"] as const) {
        for (const precision of [0, 3, 6]) {
            for (const overridePrecision of [0, 3, 6]) {
                it(`${engine} validates ON UPDATE precision ${precision} against ${overridePrecision}`, async () => {
                    const options: EntitySchemaColumnOptions = {
                        type: "datetime",
                        precision,
                        onUpdate: `CURRENT_TIMESTAMP(${precision})`,
                        dialectTypes: {
                            [engine]: `timestamp(${overridePrecision})`,
                        },
                    }
                    if (precision === overridePrecision) {
                        const f = await fixture(engine, options)
                        expect(f.physical.onUpdate).to.equal(options.onUpdate)
                        expect(f.column.precision).to.equal(precision)
                    } else {
                        let failure: unknown
                        try {
                            await fixture(engine, options)
                        } catch (error) {
                            failure = error
                        }
                        expect(failure).to.be.instanceOf(Error)
                        expect((failure as Error).message).to.contain(
                            "ON UPDATE CURRENT_TIMESTAMP precision",
                        )
                    }
                })
            }
        }
        for (const expression of [
            "CURRENT_TIMESTAMP",
            "current_timestamp()",
            " current_timestamp ( 0 ) ",
            "NOW",
            "now()",
        ]) {
            it(`${engine} recognizes zero precision ${expression}`, async () => {
                const f = await fixture(engine, {
                    type: "datetime",
                    onUpdate: expression,
                    dialectTypes: { [engine]: "timestamp(0)" },
                })
                expect(f.physical.onUpdate).to.equal(expression)
            })
        }
        it(`${engine} rejects a case-insensitive spaced precision conflict`, async () => {
            let failure: unknown
            try {
                await fixture(engine, {
                    type: "datetime",
                    precision: 3,
                    onUpdate: " current_timestamp ( 3 ) ",
                    dialectTypes: { [engine]: "datetime(6)" },
                })
            } catch (error) {
                failure = error
            }
            expect(failure).to.be.instanceOf(Error)
            expect((failure as Error).message).to.contain(
                "ON UPDATE CURRENT_TIMESTAMP precision",
            )
        })
        it(`${engine} preserves unrecognized expressions without rewriting`, async () => {
            const f = await fixture(engine, {
                type: "datetime",
                precision: 3,
                onUpdate: "custom_update_expression()",
                dialectTypes: { [engine]: "datetime(6)" },
            })
            expect(f.physical.onUpdate).to.equal("custom_update_expression()")
        })
        it(`${engine} leaves non-overridden ON UPDATE validation unchanged`, async () => {
            const f = await fixture(engine, {
                type: "datetime",
                precision: 6,
                onUpdate: "CURRENT_TIMESTAMP(3)",
            })
            expect(f.physical).to.equal(f.column)
        })
    }

    for (const engine of ["mysql", "aurora-mysql"] as const) {
        for (const precision of [0, 3, 6]) {
            it(`${engine} evaluates a matching timestamp default factory once at precision ${precision}`, async () => {
                let calls = 0
                const factory = () => {
                    calls++
                    return `CURRENT_TIMESTAMP(${precision})`
                }
                const f = await fixture(engine, {
                    type: "datetime",
                    precision,
                    default: factory,
                    dialectTypes: { [engine]: `timestamp(${precision})` },
                })
                expect(calls).to.equal(1)
                expect(f.column.default).to.equal(factory)
                expect(f.tableColumn.default).to.equal(
                    `CURRENT_TIMESTAMP(${precision})`,
                )
            })
        }
        for (const expression of [
            "CURRENT_TIMESTAMP(3)",
            " now(3) ",
            " current_timestamp ( 3 ) ",
            "CURRENT_TIMESTAMP",
            "now()",
        ]) {
            it(`${engine} rejects default precision conflict ${expression} without extra evaluation`, async () => {
                let calls = 0
                let failure: unknown
                try {
                    await fixture(engine, {
                        type: "datetime",
                        precision: 3,
                        default: () => {
                            calls++
                            return expression
                        },
                        dialectTypes: { [engine]: "datetime(6)" },
                    })
                } catch (error) {
                    failure = error
                }
                expect(failure).to.be.instanceOf(Error)
                expect((failure as Error).message).to.contain(
                    "DEFAULT CURRENT_TIMESTAMP precision",
                )
                expect(calls).to.equal(1)
            })
        }
        it(`${engine} does not interpret literal strings as default functions`, async () => {
            const f = await fixture(engine, {
                type: "datetime",
                precision: 3,
                default: "CURRENT_TIMESTAMP(3)",
                dialectTypes: { [engine]: "datetime(6)" },
            })
            expect(f.tableColumn.default).to.equal("'CURRENT_TIMESTAMP(3)'")
        })
        it(`${engine} does not interpret compound default expressions`, async () => {
            let calls = 0
            const expression = "(CURRENT_TIMESTAMP(3) + INTERVAL 1 SECOND)"
            const f = await fixture(engine, {
                type: "datetime",
                precision: 3,
                default: () => {
                    calls++
                    return expression
                },
                dialectTypes: { [engine]: "datetime(6)" },
            })
            expect(f.tableColumn.default).to.equal(expression)
            expect(calls).to.equal(1)
        })
        it(`${engine} preserves default-factory behavior without an override`, async () => {
            let calls = 0
            const f = await fixture(engine, {
                type: "datetime",
                precision: 6,
                default: () => {
                    calls++
                    return "CURRENT_TIMESTAMP(3)"
                },
            })
            expect(f.tableColumn.default).to.equal("CURRENT_TIMESTAMP(3)")
            expect(calls).to.equal(1)
        })
    }

    for (const override of ["integer", "bytea", "enum"]) {
        it(`postgres removes collation from ${override}`, async () => {
            const f = await fixture("postgres", {
                type: "varchar",
                enum: ["one", "two"],
                collation: "C",
                dialectTypes: { postgres: override },
            })
            const runner = new InspectPostgresQueryRunner(
                f.dataSource.driver as PostgresDriver,
                "master",
            )
            expect(f.physical.collation).to.equal(undefined)
            expect(runner.declaration(f.table, f.tableColumn)).not.to.contain(
                "COLLATE",
            )
            expect(f.column.collation).to.equal("C")
        })
    }
    for (const override of ["char(4)", "varchar(40)", "text", "citext"]) {
        it(`postgres retains collation for ${override}`, async () => {
            const f = await fixture("postgres", {
                type: "varchar",
                collation: "C",
                dialectTypes: { postgres: override },
            })
            expect(f.physical.collation).to.equal("C")
        })
    }
    for (const override of ["integer", "text", "char(4)", "citext"]) {
        it(`aurora-postgres filters collation for ${override}`, async () => {
            const f = await fixture("aurora-postgres", {
                type: "varchar",
                collation: "C",
                dialectTypes: { "aurora-postgres": override },
            })
            expect(f.physical.collation).to.equal(
                override === "integer" ? undefined : "C",
            )
        })
    }
    it("postgres retains collation on collatable arrays", async () => {
        const f = await fixture("postgres", {
            type: "varchar",
            array: true,
            collation: "C",
            dialectTypes: { postgres: "text" },
        })
        expect(f.physical.collation).to.equal("C")
        expect(f.physical.isArray).to.equal(true)
    })
    it("aurora-postgres rejects incompatible generated overrides", async () => {
        let failure: unknown
        try {
            await fixture("aurora-postgres", {
                type: "integer",
                generated: "increment",
                dialectTypes: { "aurora-postgres": "varchar(40)" },
            })
        } catch (error) {
            failure = error
        }
        expect(failure).to.be.instanceOf(Error)
        expect((failure as Error).message).to.contain("aurora-postgres")
    })
    it("mysql retains enum collation", async () => {
        const f = await fixture("mysql", {
            type: "varchar",
            enum: ["one", "two"],
            collation: "utf8mb4_bin",
            dialectTypes: { mysql: "enum" },
        })
        expect(f.physical.collation).to.equal("utf8mb4_bin")
    })

    for (const strategy of ["increment", "identity"] as const) {
        async function generated(override: string, array = false) {
            class GeneratedOverride {
                id: number
            }
            Entity()(GeneratedOverride)
            const options = {
                type: "integer" as const,
                array,
                dialectTypes: { postgres: override },
            }
            if (strategy === "identity") {
                PrimaryGeneratedColumn("identity", options)(
                    GeneratedOverride.prototype,
                    "id",
                )
            } else {
                PrimaryGeneratedColumn("increment", options)(
                    GeneratedOverride.prototype,
                    "id",
                )
            }
            const source = new MetadataOnlyDataSource({
                type: "postgres",
                driver: {},
                entities: [GeneratedOverride],
            })
            await source.prepareMetadata()
            return {
                source,
                column: source.getMetadata(GeneratedOverride).columns[0],
            }
        }
        for (const override of ["varchar(40)", "numeric(10,0)", "uuid"]) {
            it(`postgres rejects ${strategy} override ${override} at metadata validation`, async () => {
                let failure: unknown
                try {
                    await generated(override)
                } catch (error) {
                    failure = error
                }
                expect(failure).to.be.instanceOf(Error)
                expect((failure as Error).message).to.contain("dialectTypes")
                expect((failure as Error).message).to.contain(strategy)
            })
        }
        it(`postgres rejects array ${strategy} overrides`, async () => {
            let failure: unknown
            try {
                await generated("integer", true)
            } catch (error) {
                failure = error
            }
            expect(failure).to.be.instanceOf(Error)
            expect((failure as Error).message).to.contain("non-array integer")
        })
        for (const override of [
            "smallint",
            "int2",
            "integer",
            "int4",
            "bigint",
            "int8",
        ]) {
            it(`postgres retains ${strategy} for ${override}`, async () => {
                const { source, column } = await generated(override)
                const physical = column.resolveDriverColumn(source.driver)
                expect(physical.isGenerated).to.equal(true)
                expect(physical.generationStrategy).to.equal(strategy)
                expect(column.type).to.equal("integer")
                const runner = new InspectPostgresQueryRunner(
                    source.driver as PostgresDriver,
                    "master",
                )
                const declaration = runner.declaration(
                    new Table({ name: "generated_override" }),
                    new TableColumn(
                        TableUtils.createTableColumnOptions(
                            column,
                            source.driver,
                        ),
                    ),
                )
                expect(declaration).to.contain(
                    strategy === "identity" ? "AS IDENTITY" : "SERIAL",
                )
            })
        }
    }

    it("preserves explicitly overridden MySQL default precision and scale", async () => {
        const f = await fixture("mysql", {
            type: "decimal",
            dialectTypes: { mysql: "decimal(10,0)" },
        })
        const runner = new InspectMysqlQueryRunner(
            f.dataSource.driver as MysqlDriver,
            "master",
        )
        expect(runner.defaultPrecision(f.table, f.tableColumn, 10)).to.equal(
            false,
        )
        expect(runner.defaultScale(f.table, f.tableColumn, 0)).to.equal(false)
        expect(f.column.precision).to.equal(undefined)
        expect(f.column.scale).to.equal(undefined)
        expect(
            f.dataSource.driver.findChangedColumns(
                [f.tableColumn],
                [f.physical],
            ),
        ).to.be.empty
    })
    it("preserves an explicit physical length equal to the driver default", async () => {
        const f = await fixture("mysql", {
            type: "text",
            dialectTypes: { mysql: "varchar(255)" },
        })
        const runner = new InspectMysqlQueryRunner(
            f.dataSource.driver as MysqlDriver,
            "master",
        )
        expect(runner.defaultLength(f.table, f.tableColumn, "255")).to.equal(
            false,
        )
    })
    it("still suppresses implicit MySQL default length without overrides", async () => {
        const f = await fixture("mysql", { type: "char" })
        const runner = new InspectMysqlQueryRunner(
            f.dataSource.driver as MysqlDriver,
            "master",
        )
        expect(runner.defaultLength(f.table, f.tableColumn, "1")).to.equal(true)
    })
    it("still retains explicit MySQL modifiers without overrides", async () => {
        const f = await fixture("mysql", {
            type: "decimal",
            precision: 10,
            scale: 0,
        })
        const runner = new InspectMysqlQueryRunner(
            f.dataSource.driver as MysqlDriver,
            "master",
        )
        expect(runner.defaultPrecision(f.table, f.tableColumn, 10)).to.equal(
            false,
        )
        expect(runner.defaultScale(f.table, f.tableColumn, 0)).to.equal(false)
        const text = await fixture("mysql", { type: "char", length: 1 })
        const textRunner = new InspectMysqlQueryRunner(
            text.dataSource.driver as MysqlDriver,
            "master",
        )
        expect(
            textRunner.defaultLength(text.table, text.tableColumn, "1"),
        ).to.equal(false)
    })
    it("still suppresses implicit MySQL default precision and scale", async () => {
        const f = await fixture("mysql", { type: "decimal" })
        const runner = new InspectMysqlQueryRunner(
            f.dataSource.driver as MysqlDriver,
            "master",
        )
        expect(runner.defaultPrecision(f.table, f.tableColumn, 10)).to.equal(
            true,
        )
        expect(runner.defaultScale(f.table, f.tableColumn, 0)).to.equal(true)
    })
})
