/**
 * Column types used for @PrimaryGeneratedColumn() decorator.
 */
export type PrimaryGeneratedColumnType =
    | "int" // mysql, mssql, oracle, sqlite, sap
    | "int2" // postgres, sqlite, cockroachdb
    | "int4" // postgres, cockroachdb
    | "int8" // postgres, sqlite, cockroachdb
    | "integer" // postgres, oracle, sqlite, mysql, cockroachdb, sap
    | "tinyint" // mysql, mssql, sqlite, sap
    | "smallint" // mysql, postgres, mssql, oracle, sqlite, cockroachdb, sap
    | "mediumint" // mysql, sqlite
    | "bigint" // mysql, postgres, mssql, sqlite, cockroachdb, sap
    | "dec" // oracle, mssql, sap
    | "decimal" // mysql, postgres, mssql, sqlite, sap
    | "smalldecimal" // sap
    | "fixed" // mysql
    | "numeric" // postgres, mssql, sqlite, spanner
    | "number" // oracle

/**
 * Column types where spatial properties are used.
 */
export type SpatialColumnType =
    | "geometry" // postgres
    | "geography" // postgres
    | "st_geometry" // sap
    | "st_point" // sap

/**
 * Column types where precision and scale properties are used.
 */
export type WithPrecisionColumnType =
    | "float" // mysql, mssql, oracle, sqlite
    | "double" // mysql, sqlite
    | "dec" // oracle, mssql, mysql
    | "decimal" // mysql, postgres, mssql, sqlite, ydb
    | "smalldecimal" // sap
    | "fixed" // mysql
    | "numeric" // postgres, mssql, sqlite, mysql
    | "real" // mysql, postgres, mssql, oracle, sqlite, cockroachdb, sap
    | "double precision" // postgres, oracle, sqlite, mysql, cockroachdb
    | "number" // oracle
    | "datetime" // mssql, mysql, sqlite
    | "datetime2" // mssql
    | "datetimeoffset" // mssql
    | "time" // mysql, postgres, mssql, cockroachdb
    | "time with time zone" // postgres, cockroachdb
    | "time without time zone" // postgres
    | "timestamp" // mysql, postgres, mssql, oracle, cockroachdb, spanner
    | "timestamp without time zone" // postgres, cockroachdb
    | "timestamp with time zone" // postgres, oracle, cockroachdb
    | "timestamp with local time zone" // oracle

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType =
    | "character varying" // postgres, cockroachdb
    | "varying character" // sqlite
    | "char varying" // cockroachdb
    | "nvarchar" // mssql, mysql
    | "national varchar" // mysql
    | "character" // mysql, postgres, sqlite, cockroachdb
    | "native character" // sqlite
    | "varchar" // mysql, postgres, mssql, sqlite, cockroachdb
    | "char" // mysql, postgres, mssql, oracle, cockroachdb, sap
    | "nchar" // mssql, oracle, sqlite, mysql, sap
    | "national char" // mysql
    | "varchar2" // oracle
    | "nvarchar2" // oracle, sqlite
    | "alphanum" // sap
    | "shorttext" // sap
    | "raw" // oracle
    | "binary" // mssql
    | "varbinary" // mssql, sap
    | "string" // cockroachdb, spanner

export type WithWidthColumnType =
    | "tinyint" // mysql
    | "smallint" // mysql
    | "mediumint" // mysql
    | "int" // mysql
    | "bigint" // mysql

/**
 * All other regular column types.
 */
export type SimpleColumnType =
    | "simple-array" // typeorm-specific, automatically mapped to string
    // |"string" // typeorm-specific, automatically mapped to varchar depend on platform
    | "simple-json" // typeorm-specific, automatically mapped to string
    | "simple-enum" // typeorm-specific, automatically mapped to string

    // numeric types
    | "int2" // postgres, sqlite, cockroachdb
    | "integer" // postgres, oracle, sqlite, cockroachdb
    | "int4" // postgres, cockroachdb
    | "int8" // postgres, sqlite, cockroachdb
    | "int32" // ydb
    | "int64" // cockroachdb, spanner, ydb
    | "unsigned big int" // sqlite
    | "uint8" // ydb
    | "uint32" // ydb
    | "uint64" // ydb
    | "float" // mysql, mssql, oracle, sqlite, sap, ydb
    | "double" // ydb
    | "float4" // postgres, cockroachdb
    | "float8" // postgres, cockroachdb
    | "float64" // spanner
    | "smallmoney" // mssql
    | "money" // postgres, mssql

    // boolean types
    | "boolean" // postgres, sqlite, mysql, cockroachdb
    | "bool" // postgres, mysql, cockroachdb, spanner, ydb

    // text/binary types
    | "tinyblob" // mysql
    | "tinytext" // mysql
    | "mediumblob" // mysql
    | "mediumtext" // mysql
    | "blob" // mysql, oracle, sqlite, cockroachdb, sap
    | "text" // mysql, postgres, mssql, sqlite, cockroachdb, sap
    | "ntext" // mssql
    | "citext" // postgres
    | "hstore" // postgres
    | "longblob" // mysql
    | "longtext" // mysql
    | "alphanum" // sap
    | "shorttext" // sap
    | "bytes" // cockroachdb, spanner
    | "bytea" // postgres, cockroachdb
    | "long" // oracle
    | "raw" // oracle
    | "long raw" // oracle
    | "bfile" // oracle
    | "clob" // oracle, sqlite, sap
    | "nclob" // oracle, sap
    | "image" // mssql
    | "dyNumber" // ydb
    | "string" // ydb
    | "utf8" // ydb

    // date types
    | "timetz" // postgres
    | "timestamptz" // postgres, cockroachdb
    | "timestamp with local time zone" // oracle
    | "smalldatetime" // mssql
    | "date" // mysql, postgres, mssql, oracle, sqlite, spanner, ydb
    | "datetime" // ydb
    | "timestamp" // ydb
    | "interval" //ydb
    | "interval year to month" // oracle
    | "interval day to second" // oracle
    | "interval" // postgres, cockroachdb
    | "year" // mysql
    | "seconddate" // sap

    // geometric types
    | "point" // postgres, mysql
    | "line" // postgres
    | "lseg" // postgres
    | "box" // postgres
    | "circle" // postgres
    | "path" // postgres
    | "polygon" // postgres, mysql
    | "geography" // mssql
    | "geometry" // mysql
    | "linestring" // mysql
    | "multipoint" // mysql
    | "multilinestring" // mysql
    | "multipolygon" // mysql
    | "geometrycollection" // mysql
    | "st_geometry" // sap
    | "st_point" // sap

    // range types
    | "int4range" // postgres
    | "int8range" // postgres
    | "numrange" // postgres
    | "tsrange" // postgres
    | "tstzrange" // postgres
    | "daterange" // postgres

    // other types
    | "enum" // mysql, postgres
    | "set" // mysql
    | "cidr" // postgres
    | "inet" // postgres, cockroachdb
    | "inet4" // mariadb
    | "inet6" // mariadb
    | "macaddr" // postgres
    | "bit" // postgres, mssql
    | "bit varying" // postgres
    | "varbit" // postgres
    | "tsvector" // postgres
    | "tsquery" // postgres
    | "uuid" // postgres, cockroachdb, mariadb
    | "xml" // mssql, postgres
    | "json" // mysql, postgres, cockroachdb, spanner, ydb
    | "jsonb" // postgres, cockroachdb
    | "jsonDocument" // ydb
    | "yson" // ydb
    | "varbinary" // mssql, sap
    | "hierarchyid" // mssql
    | "sql_variant" // mssql
    | "rowid" // oracle
    | "urowid" // oracle
    | "uniqueidentifier" // mssql
    | "rowversion" // mssql
    | "array" // cockroachdb, sap, spanner
    | "cube" // postgres
    | "ltree" // postgres

/**
 * Any column type column can be.
 */
export type ColumnType =
    | WithPrecisionColumnType
    | WithLengthColumnType
    | WithWidthColumnType
    | SpatialColumnType
    | SimpleColumnType
    | BooleanConstructor
    | DateConstructor
    | NumberConstructor
    | StringConstructor
