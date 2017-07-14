/**
 * Sql server driver requires parameter types to be specified fo input parameters used in the query.
 *
 * @see https://github.com/patriksimek/node-mssql#data-types
 */
export class MssqlParameter {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    public params: any[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(value: any, type: "bit");
    constructor(value: any, type: "bigint");
    constructor(value: any, type: "decimal", precision?: number, scale?: number);
    constructor(value: any, type: "float");
    constructor(value: any, type: "int");
    constructor(value: any, type: "money");
    constructor(value: any, type: "numeric", precision?: number, scale?: number);
    constructor(value: any, type: "smallint");
    constructor(value: any, type: "smallmoney");
    constructor(value: any, type: "real");
    constructor(value: any, type: "tinyint");
    constructor(value: any, type: "char", length?: number);
    constructor(value: any, type: "nchar", length?: number);
    constructor(value: any, type: "text");
    constructor(value: any, type: "ntext");
    constructor(value: any, type: "varchar", length?: number);
    constructor(value: any, type: "nvarchar", length?: number);
    constructor(value: any, type: "xml");
    constructor(value: any, type: "time", scale?: number);
    constructor(value: any, type: "date");
    constructor(value: any, type: "datetime");
    constructor(value: any, type: "datetime2", scale?: number);
    constructor(value: any, type: "datetimeoffset", scale?: number);
    constructor(value: any, type: "smalldatetime");
    constructor(value: any, type: "uniqueidentifier");
    constructor(value: any, type: "variant");
    constructor(value: any, type: "binary");
    constructor(value: any, type: "varbinary", length?: number);
    constructor(value: any, type: "image");
    constructor(value: any, type: "udt");
    constructor(value: any, type: "geography");
    constructor(value: any, type: "geometry");
    constructor(public value: any, public type: string, ...params: number[]) {
        this.params = params || [];
    }

}