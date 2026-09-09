import { expect } from "chai"
import { AuroraMysqlDriver } from "../../../src/driver/aurora-mysql/AuroraMysqlDriver"
import { AuroraPostgresDriver } from "../../../src/driver/aurora-postgres/AuroraPostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import type { Driver } from "../../../src/driver/Driver"
import { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver"
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { ReactNativeDriver } from "../../../src/driver/react-native/ReactNativeDriver"
import { SapDriver } from "../../../src/driver/sap/SapDriver"
import { SpannerDriver } from "../../../src/driver/spanner/SpannerDriver"
import { AbstractSqliteDriver } from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver"
import { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import type { ColumnType } from "../../../src/driver/types/ColumnTypes"
import type { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("driver > createFullType", () => {
    const build = (
        ctor: { prototype: object },
        withLengthColumnTypes: ColumnType[],
        properties: Record<string, unknown> = {},
    ) =>
        Object.assign(Object.create(ctor.prototype), {
            spatialTypes: [],
            withLengthColumnTypes,
            ...properties,
        }) as Driver

    const column = (options: Partial<TableColumn>) => options as TableColumn

    const drivers: {
        name: string
        driver: Driver
        supportedType: string
        unsupportedType: string
        precisionType: string
    }[] = [
        {
            name: "PostgresDriver",
            driver: build(PostgresDriver, ["character varying", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "uuid",
            precisionType: "numeric",
        },
        {
            name: "AuroraPostgresDriver",
            driver: build(AuroraPostgresDriver, [
                "character varying",
                "varchar",
            ]),
            supportedType: "varchar",
            unsupportedType: "uuid",
            precisionType: "numeric",
        },
        {
            name: "CockroachDriver",
            driver: build(CockroachDriver, ["character varying", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "uuid",
            precisionType: "numeric",
        },
        {
            name: "MysqlDriver",
            driver: build(MysqlDriver, ["varchar"], {
                uuidColumnTypeSuported: false,
            }),
            supportedType: "varchar",
            unsupportedType: "int",
            precisionType: "decimal",
        },
        {
            name: "AuroraMysqlDriver",
            driver: build(AuroraMysqlDriver, ["varchar"]),
            supportedType: "varchar",
            unsupportedType: "int",
            precisionType: "decimal",
        },
        {
            name: "OracleDriver",
            driver: build(OracleDriver, ["varchar2"]),
            supportedType: "varchar2",
            unsupportedType: "number",
            precisionType: "number",
        },
        {
            name: "SqlServerDriver",
            driver: build(SqlServerDriver, ["nvarchar", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "int",
            precisionType: "decimal",
        },
        {
            name: "SapDriver",
            driver: build(SapDriver, ["nvarchar", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "integer",
            precisionType: "decimal",
        },
        {
            name: "SpannerDriver",
            driver: build(SpannerDriver, ["string"]),
            supportedType: "string",
            unsupportedType: "int64",
            precisionType: "numeric",
        },
        {
            name: "AbstractSqliteDriver",
            driver: build(AbstractSqliteDriver, ["varchar"]),
            supportedType: "varchar",
            unsupportedType: "integer",
            precisionType: "numeric",
        },
        {
            name: "ReactNativeDriver",
            driver: build(ReactNativeDriver, ["varchar"]),
            supportedType: "varchar",
            unsupportedType: "integer",
            precisionType: "numeric",
        },
    ]

    for (const {
        name,
        driver,
        supportedType,
        unsupportedType,
        precisionType,
    } of drivers) {
        describe(name, () => {
            it("renders a length for a type that accepts one", () => {
                expect(
                    driver.createFullType(
                        column({ type: supportedType, length: "255" }),
                    ),
                ).to.equal(`${supportedType}(255)`)
            })

            it("matches supported types case-insensitively", () => {
                const uppercaseType = supportedType.toUpperCase()

                expect(
                    driver.createFullType(
                        column({ type: uppercaseType, length: "255" }),
                    ),
                ).to.equal(`${uppercaseType}(255)`)
            })

            it("ignores a length carried by a type that accepts none", () => {
                expect(
                    driver.createFullType(
                        column({ type: unsupportedType, length: "36" }),
                    ),
                ).to.equal(unsupportedType)
            })

            it("renders no length when none is set", () => {
                expect(
                    driver.createFullType(column({ type: unsupportedType })),
                ).to.equal(unsupportedType)
            })

            it("still renders precision and scale", () => {
                expect(
                    driver.createFullType(
                        column({
                            type: precisionType,
                            precision: 5,
                            scale: 2,
                        }),
                    ),
                ).to.equal(`${precisionType}(5,2)`)
            })

            it("still renders precision alone", () => {
                expect(
                    driver.createFullType(
                        column({ type: precisionType, precision: 5 }),
                    ),
                ).to.equal(`${precisionType}(5)`)
            })
        })
    }

    it("does not render a length on MariaDB's native uuid type", () => {
        const driver = build(MysqlDriver, ["varchar"], {
            uuidColumnTypeSuported: true,
        })

        expect(
            driver.createFullType(
                column({
                    type: "uuid",
                    length: "36",
                    generationStrategy: "uuid",
                }),
            ),
        ).to.equal("uuid")
    })
})
