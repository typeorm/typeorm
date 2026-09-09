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
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("driver > getColumnLength", () => {
    const build = (
        ctor: { prototype: object },
        withLengthColumnTypes: ColumnType[],
        properties: Record<string, unknown> = {},
    ) =>
        Object.assign(Object.create(ctor.prototype), {
            withLengthColumnTypes,
            ...properties,
        }) as Driver

    const column = (options: Partial<ColumnMetadata>) =>
        options as ColumnMetadata

    const drivers: {
        name: string
        driver: Driver
        supportedType: ColumnType
        unsupportedType: ColumnType
        defaultLength?: string
    }[] = [
        {
            name: "PostgresDriver",
            driver: build(PostgresDriver, ["character varying", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "uuid",
        },
        {
            name: "AuroraPostgresDriver",
            driver: build(AuroraPostgresDriver, [
                "character varying",
                "varchar",
            ]),
            supportedType: "varchar",
            unsupportedType: "uuid",
        },
        {
            name: "CockroachDriver",
            driver: build(CockroachDriver, ["character varying", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "uuid",
        },
        {
            name: "MysqlDriver",
            driver: build(MysqlDriver, ["varchar"], {
                uuidColumnTypeSuported: false,
            }),
            supportedType: "varchar",
            unsupportedType: "int",
            defaultLength: "255",
        },
        {
            name: "AuroraMysqlDriver",
            driver: build(AuroraMysqlDriver, ["varchar"]),
            supportedType: "varchar",
            unsupportedType: "int",
            defaultLength: "255",
        },
        {
            name: "OracleDriver",
            driver: build(OracleDriver, ["varchar2"]),
            supportedType: "varchar2",
            unsupportedType: "number",
            defaultLength: "255",
        },
        {
            name: "SqlServerDriver",
            driver: build(SqlServerDriver, ["nvarchar", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "int",
            defaultLength: "255",
        },
        {
            name: "SapDriver",
            driver: build(SapDriver, ["nvarchar", "varchar"]),
            supportedType: "varchar",
            unsupportedType: "integer",
            defaultLength: "255",
        },
        {
            name: "SpannerDriver",
            driver: build(SpannerDriver, ["string"]),
            supportedType: "string",
            unsupportedType: "int64",
            defaultLength: "max",
        },
        {
            name: "AbstractSqliteDriver",
            driver: build(AbstractSqliteDriver, ["varchar"]),
            supportedType: "varchar",
            unsupportedType: "integer",
        },
        {
            name: "ReactNativeDriver",
            driver: build(ReactNativeDriver, ["varchar"]),
            supportedType: "varchar",
            unsupportedType: "integer",
        },
    ]

    for (const {
        name,
        driver,
        supportedType,
        unsupportedType,
        defaultLength,
    } of drivers) {
        describe(name, () => {
            it("reports a declared length for a type that accepts one", () => {
                expect(
                    driver.getColumnLength(
                        column({ type: supportedType, length: "255" }),
                    ),
                ).to.equal("255")
            })

            it("normalizes constructor types before checking length support", () => {
                expect(
                    driver.getColumnLength(
                        column({ type: String, length: "255" }),
                    ),
                ).to.equal("255")
            })

            it("ignores a declared length for a type that accepts none", () => {
                expect(
                    driver.getColumnLength(
                        column({ type: unsupportedType, length: "36" }),
                    ),
                ).to.equal("")
            })

            it("reports no length for a lengthless type without one", () => {
                expect(
                    driver.getColumnLength(column({ type: unsupportedType })),
                ).to.equal("")
            })

            if (defaultLength) {
                it("preserves the driver's type-specific default", () => {
                    expect(
                        driver.getColumnLength(column({ type: String })),
                    ).to.equal(defaultLength)
                })
            }
        })
    }

    describe("MysqlDriver uuid defaults", () => {
        it("preserves the generated uuid width when uuid normalizes to varchar", () => {
            const driver = build(MysqlDriver, ["varchar"], {
                uuidColumnTypeSuported: false,
            })

            expect(
                driver.getColumnLength(
                    column({ type: "uuid", generationStrategy: "uuid" }),
                ),
            ).to.equal("36")
        })

        it("ignores the uuid width when MariaDB supports the native type", () => {
            const driver = build(MysqlDriver, ["varchar"], {
                uuidColumnTypeSuported: true,
            })

            expect(
                driver.getColumnLength(
                    column({
                        type: "uuid",
                        length: "36",
                        generationStrategy: "uuid",
                    }),
                ),
            ).to.equal("")
        })
    })
})
