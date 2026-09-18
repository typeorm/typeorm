/**
 * SQL Server parameter type names supported by MssqlParameter.
 */
export type MssqlParameterType =
    | "bit"
    | "bigint"
    | "decimal"
    | "float"
    | "int"
    | "money"
    | "numeric"
    | "smallint"
    | "smallmoney"
    | "real"
    | "tinyint"
    | "char"
    | "nchar"
    | "text"
    | "ntext"
    | "varchar"
    | "nvarchar"
    | "xml"
    | "time"
    | "date"
    | "datetime"
    | "datetime2"
    | "datetimeoffset"
    | "smalldatetime"
    | "uniqueidentifier"
    | "variant"
    | "binary"
    | "varbinary"
    | "image"
    | "udt"
    | "geography"
    | "geometry"
    | "rowversion"
    | "vector"

const MSSQL_PARAMETER_TYPES: ReadonlySet<string> = new Set<MssqlParameterType>([
    "bit",
    "bigint",
    "decimal",
    "float",
    "int",
    "money",
    "numeric",
    "smallint",
    "smallmoney",
    "real",
    "tinyint",
    "char",
    "nchar",
    "text",
    "ntext",
    "varchar",
    "nvarchar",
    "xml",
    "time",
    "date",
    "datetime",
    "datetime2",
    "datetimeoffset",
    "smalldatetime",
    "uniqueidentifier",
    "variant",
    "binary",
    "varbinary",
    "image",
    "udt",
    "geography",
    "geometry",
    "rowversion",
    "vector",
])

/**
 * Narrows a type name resolved at runtime (e.g. from `Driver.normalizeType()`)
 * to a supported SQL Server parameter type.
 *
 * @param type type name to check
 */
export function isMssqlParameterType(type: string): type is MssqlParameterType {
    return MSSQL_PARAMETER_TYPES.has(type)
}

/**
 * Sql server driver requires parameter types to be specified fo input parameters used in the query.
 *
 * @see https://github.com/patriksimek/node-mssql#data-types
 */
export class MssqlParameter {
    readonly "@instanceof" = Symbol.for("MssqlParameter")

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    public params: any[] = []

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(value: any, type: "bit")
    constructor(value: any, type: "bigint")
    constructor(value: any, type: "decimal", precision?: number, scale?: number)
    constructor(value: any, type: "float")
    constructor(value: any, type: "int")
    constructor(value: any, type: "money")
    constructor(value: any, type: "numeric", precision?: number, scale?: number)
    constructor(value: any, type: "smallint")
    constructor(value: any, type: "smallmoney")
    constructor(value: any, type: "real")
    constructor(value: any, type: "tinyint")
    constructor(value: any, type: "char", length?: number)
    constructor(value: any, type: "nchar", length?: number)
    constructor(value: any, type: "text")
    constructor(value: any, type: "ntext")
    constructor(value: any, type: "varchar", length?: number)
    constructor(value: any, type: "nvarchar", length?: number)
    constructor(value: any, type: "xml")
    constructor(value: any, type: "time", scale?: number)
    constructor(value: any, type: "date")
    constructor(value: any, type: "datetime")
    constructor(value: any, type: "datetime2", scale?: number)
    constructor(value: any, type: "datetimeoffset", scale?: number)
    constructor(value: any, type: "smalldatetime")
    constructor(value: any, type: "uniqueidentifier")
    constructor(value: any, type: "variant")
    constructor(value: any, type: "binary")
    constructor(value: any, type: "varbinary", length?: number)
    constructor(value: any, type: "image")
    constructor(value: any, type: "udt")
    constructor(value: any, type: "geography")
    constructor(value: any, type: "geometry")
    constructor(value: any, type: "rowversion")
    constructor(value: any, type: "vector", length: number)
    /**
     * For type names resolved at runtime and narrowed with
     * `isMssqlParameterType()`; only supported SQL Server type names compile.
     */
    constructor(value: any, type: MssqlParameterType, ...params: number[])
    constructor(
        public value: any,
        public type: string,
        ...params: number[]
    ) {
        this.params = params || []
    }
}
