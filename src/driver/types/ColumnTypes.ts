/**
 * Column types where precision and scale properties are used.
 */
export type PrimaryGeneratedColumnType = "int" // mysql, mssql, oracle, sqlite
    |"int2" // postgres, sqlite
    |"int2" // postgres, sqlite
    |"int4" // postgres
    |"int8" // postgres, sqlite
    |"integer" // postgres, oracle, sqlite
    |"tinyint" // mysql, mssql, sqlite
    |"smallint" // mysql, postgres, mssql, oracle, sqlite
    |"mediumint" // mysql, sqlite
    |"bigint" // mysql, postgres, mssql, sqlite
    |"dec" // oracle, mssql
    |"decimal" // mysql, postgres, mssql, sqlite
    |"numeric" // postgres, mssql, sqlite
    |"number" // oracle
    |"uuid"; // oracle

/**
 * Column types where precision and scale properties are used.
 */
export type WithPrecisionColumnType = "float" // mysql, mssql, oracle, sqlite
    |"double" // mysql, sqlite
    |"dec" // oracle, mssql
    |"decimal" // mysql, postgres, mssql, sqlite
    |"numeric" // postgres, mssql, sqlite
    |"real" // mysql, postgres, mssql, oracle, sqlite
    |"double precision" // postgres, oracle, sqlite
    |"number" // oracle
    |"datetime" // mssql, mysql, sqlite
    |"datetime2" // mssql
    |"datetimeoffset" // mssql
    |"time" // mysql, postgres, mssql
    |"time with time zone" // postgres
    |"time without time zone" // postgres
    |"timestamp" // mysql, postgres, mssql, oracle
    |"timestamp without time zone" // postgres
    |"timestamp with time zone"; // postgres, oracle

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType = "int" // mysql, postgres, mssql, oracle, sqlite
    |"tinyint" // mysql, mssql, sqlite
    |"smallint" // mysql, postgres, mssql, oracle, sqlite
    |"mediumint" // mysql, sqlite
    |"bigint" // mysql, postgres, mssql, sqlite
    |"character varying" // postgres
    |"varying character" // sqlite
    |"nvarchar" // mssql
    |"character" // mysql, postgres, sqlite
    |"native character" // sqlite
    |"varchar" // mysql, postgres, mssql, sqlite
    |"char" // mysql, postgres, mssql, oracle
    |"nchar" // mssql, oracle, sqlite
    |"varchar2" // oracle
    |"nvarchar2" // oracle, sqlite
    |"binary" // mssql
    |"varbinary"; // mssql

/**
 * All other regular column types.
 */
export type SimpleColumnType =

    "simple-array" // typeorm-specific, automatically mapped to string
    // |"string" // typeorm-specific, automatically mapped to varchar depend on platform

    // numeric types
    |"bit" // mssql
    |"int2" // postgres, sqlite
    |"integer" // postgres, oracle, sqlite
    |"int4" // postgres
    |"int8" // postgres, sqlite
    |"unsigned big int" // sqlite
    |"float4" // postgres
    |"float8" // postgres
    |"smallserial" // postgres
    |"serial2" // postgres
    |"serial" // postgres
    |"serial4" // postgres
    |"bigserial" // postgres
    |"serial8" // postgres
    |"smallmoney" // mssql
    |"money" // postgres, mssql

    // boolean types
    |"boolean" // postgres, sqlite
    |"bool" // postgres

    // text/binary types
    |"tinyblob" // mysql
    |"tinytext" // mysql
    |"mediumblob" // mysql
    |"mediumtext" // mysql
    |"blob" // mysql, oracle, sqlite
    |"text" // mysql, postgres, mssql, sqlite
    |"ntext" // mssql
    |"longblob" // mysql
    |"longtext" // mysql
    |"bytea" // postgres
    |"long" // oracle
    |"raw" // oracle
    |"long raw" // oracle
    |"bfile" // oracle
    |"clob" // oracle, sqlite
    |"nclob" // oracle
    |"image" // mssql

    // date types
    |"timestamp with local time zone" // oracle
    |"smalldatetime" // mssql
    |"date" // mysql, postgres, mssql, oracle, sqlite
    |"interval year" // oracle
    |"interval day" // oracle
    |"interval" // postgres
    |"year" // mysql

    // geometric types
    |"point" // postgres
    |"line" // postgres
    |"lseg" // postgres
    |"box" // postgres
    |"circle" // postgres
    |"path" // postgres
    |"polygon" // postgres

    // other types
    |"enum" // mysql, postgres
    |"cidr" // postgres
    |"inet" // postgres
    |"macaddr"// postgres
    |"bit" // postgres
    |"bit varying" // postgres
    |"varbit"// postgres
    |"tsvector" // postgres
    |"tsquery" // postgres
    |"uuid" // postgres
    |"xml" // mssql, postgres
    |"json" // mysql, postgres
    |"jsonb" // postgres
    |"varbinary" // mssql
    |"cursor" // mssql
    |"hierarchyid" // mssql
    |"sql_variant" // mssql
    |"table" // mssql
    |"rowid" // oracle
    |"urowid" // oracle
    |"uniqueidentifier"; // mssql

/**
 * Any column type column can be.
 */
export type ColumnType = WithPrecisionColumnType
    |WithLengthColumnType
    |SimpleColumnType
    |BooleanConstructor
    |DateConstructor
    |NumberConstructor
    |StringConstructor;

// "string"|"text"|"number"|"integer"|"int"|"smallint"|"bigint"|"float"|"double"|
// "decimal"|"date"|"time"|"datetime"|"boolean"|"json"|"jsonb"|"simple_array"|"uuid";

// -------------------------------------------------------------------------
// Merged Types
// -------------------------------------------------------------------------
/*
/!**
 * Column types where column length is used.
 *!/
export type WithLengthColumnType =
    VarcharColumnType|
    CharColumnType|
    IntervalColumnType|
    BitColumnType|
    VarbitColumnType;

/!**
 * Column types where time options are used.
 *!/
export type WithTimeColumnType =
    TimeColumnType|
    TimestampColumnType;

/!**
 * All other column types without extra options used.
 *!/
export type SimpleColumnType =
    SmallintColumnType|
    IntegerColumnType|
    BigintColumnType|
    DecimalColumnType|
    RealColumnType|
    DoublePrecisionColumnType|
    SmallserialColumnType|
    SerialColumnType|
    BigserialColumnType|
    MoneyColumnType|
    TextColumnType|
    ByteaColumnType|
    DateColumnType|
    BooleanColumnType|
    PointColumnType|
    LineColumnType|
    LsegColumnType|
    BoxColumnType|
    CircleColumnType|
    PathColumnType|
    PolygonColumnType|
    CidrColumnType|
    InetColumnType|
    MacaddrColumnType|
    TsvectorColumnType|
    TsqueryColumnType|
    UUIDColumnType|
    XmlColumnType|
    JsonColumnType|
    JsonbColumnType;

/!**
 * All column types supported by a database.
 *!/
export type AllColumnType =
    SimpleColumnType|
    WithLengthColumnType|
    WithTimeColumnType|
    NumericColumnType|
    EnumColumnType;


/!**
 * All data types that column can be.
 *!/
export type ColumnType =
    "tinyint"|
    "smallint"|
    "int2"|
    "mediumint"|
    "integer"|
    "int"|
    "int4"|
    "bigint"|
    "int8"|
    "decimal"|
    "numeric"|
    "real"|
    "float4"|
    "float"|
    "double"|
    "double precision"|
    "numeric"|
    "decimal"|
    "string"|"text"|"number"|"integer"|"int"|"smallint"|"bigint"|"float"|"double"|
                         "decimal"|"date"|"time"|"datetime"|"boolean"|"json"|"jsonb"|"simple_array"|"uuid";*/
/*

/!**
 * All data types that column can be.
 *!/
export class ColumnTypes {

    /!**
     * SQL VARCHAR type. Your class's property type should be a "string".
     *!/
    static STRING: ColumnType = "string";

    /!**
     * SQL CLOB type. Your class's property type should be a "string".
     *!/
    static TEXT: ColumnType = "text";

    /!**
     * SQL FLOAT type. Your class's property type should be a "number".
     *!/
    static NUMBER: ColumnType = "number";

    /!**
     * SQL INT type. Your class's property type should be a "number".
     *!/
    static INTEGER: ColumnType = "integer";

    /!**
     * SQL INT type. Your class's property type should be a "number".
     *!/
    static INT: ColumnType = "int";

    /!**
     * SQL SMALLINT type. Your class's property type should be a "number".
     *!/
    static SMALLINT: ColumnType = "smallint";

    /!**
     * SQL BIGINT type. Your class's property type should be a "number".
     *!/
    static BIGINT: ColumnType = "bigint";

    /!**
     * SQL FLOAT type. Your class's property type should be a "number".
     *!/
    static FLOAT: ColumnType = "float";

    /!**
     * SQL FLOAT type. Your class's property type should be a "number".
     *!/
    static DOUBLE: ColumnType = "double";

    /!**
     * SQL DECIMAL type. Your class's property type should be a "string".
     *!/
    static DECIMAL: ColumnType = "decimal";

    /!**
     * SQL DATETIME type. Your class's property type should be a "Date" object.
     *!/
    static DATE: ColumnType = "date";

    /!**
     * SQL TIME type. Your class's property type should be a "Date" object.
     *!/
    static TIME: ColumnType = "time";

    /!**
     * SQL DATETIME/TIMESTAMP type. Your class's property type should be a "Date" object.
     *!/
    static DATETIME: ColumnType = "datetime";

    /!**
     * SQL BOOLEAN type. Your class's property type should be a "boolean".
     *!/
    static BOOLEAN: ColumnType = "boolean";

    /!**
     * SQL CLOB type. Your class's property type should be any Object.
     *!/
    static JSON: ColumnType = "json";

    /!**
     * Postgres jsonb type. Your class's property type should be any Object.
     *!/
    static JSONB: ColumnType = "jsonb";

    /!**
     * SQL CLOB type. Your class's property type should be array of string. Note: value in this column should not contain
     * a comma (",") since this symbol is used to create a string from the array, using .join(",") operator.
     *!/
    static SIMPLE_ARRAY: ColumnType = "simple_array";

    /!**
     * UUID type. Serialized to a string in typescript or javascript
     *!/
    static UUID: ColumnType = "uuid";

    /!**
     * Checks if given type in a string format is supported by ORM.
     *!/
    static isTypeSupported(type: string) {
        return this.supportedTypes.indexOf(<ColumnType> type) !== -1;
    }

    /!**
     * Returns list of all supported types by the ORM.
     *!/
    static get supportedTypes() {
        return [
            this.STRING,
            this.TEXT,
            this.NUMBER,
            this.INTEGER,
            this.INT,
            this.SMALLINT,
            this.BIGINT,
            this.FLOAT,
            this.DOUBLE,
            this.DECIMAL,
            this.DATE,
            this.TIME,
            this.DATETIME,
            this.BOOLEAN,
            this.JSON,
            this.JSONB,
            this.SIMPLE_ARRAY,
            this.UUID
        ];
    }

    /!**
     * Tries to guess a column type from the given function.
     *!/
    static determineTypeFromFunction(type: Function): ColumnType|undefined {
        if (type instanceof Date) {
            return ColumnTypes.DATETIME;

        } else if (type instanceof Function) {
            const typeName = (<any>type).name.toLowerCase();
            switch (typeName) {
                case "number":
                    return ColumnTypes.NUMBER;
                case "boolean":
                    return ColumnTypes.BOOLEAN;
                case "string":
                    return ColumnTypes.STRING;
                case "date":
                    return ColumnTypes.DATETIME;
                case "object":
                    return ColumnTypes.JSON;
            }

        } else if (type instanceof Object) {
            return ColumnTypes.JSON;

        }

        return undefined;
    }

    static typeToString(type: Function): string {
        return (type as any).name.toLowerCase();
    }

    /!**
     * Checks if column type is numeric.
     *!/
    static isNumeric(type: ColumnType) {
        return  type === ColumnTypes.NUMBER ||
                type === ColumnTypes.INT ||
                type === ColumnTypes.INTEGER ||
                type === ColumnTypes.BIGINT ||
                type === ColumnTypes.SMALLINT ||
                type === ColumnTypes.DOUBLE ||
                type === ColumnTypes.FLOAT;
    }

}*/
