/**
 * Column types used for @PrimaryGeneratedColumn() decorator.
 */
export type PrimaryGeneratedColumnType = "int" // mysql, mssql, oracle, sqlite
    |"int2" // postgres, sqlite, cockroachdb
    |"int4" // postgres, cockroachdb
    |"int8" // postgres, sqlite, cockroachdb
    |"integer" // postgres, oracle, sqlite, mysql, cockroachdb
    |"tinyint" // mysql, mssql, sqlite
    |"smallint" // mysql, postgres, mssql, oracle, sqlite, cockroachdb
    |"mediumint" // mysql, sqlite
    |"bigint" // mysql, postgres, mssql, sqlite, cockroachdb
    |"dec" // oracle, mssql
    |"decimal" // mysql, postgres, mssql, sqlite
    |"fixed" // mysql
    |"numeric" // postgres, mssql, sqlite
    |"number" // oracle
    |"uuid"; // postgres

/**
 * Column types where spatial properties are used.
 */
export type SpatialColumnType = "geometry" // postgres
    |"geography"; // postgres

/**
 * Column types where precision and scale properties are used.
 */
export type WithPrecisionColumnType = "float" // mysql, mssql, oracle, sqlite
    |"double" // mysql, sqlite
    |"dec" // oracle, mssql, mysql
    |"decimal" // mysql, postgres, mssql, sqlite
    |"fixed" // mysql
    |"numeric" // postgres, mssql, sqlite, mysql
    |"real" // mysql, postgres, mssql, oracle, sqlite, cockroachdb
    |"double precision" // postgres, oracle, sqlite, mysql, cockroachdb
    |"number" // oracle
    |"datetime" // mssql, mysql, sqlite
    |"datetime2" // mssql
    |"datetimeoffset" // mssql
    |"time" // mysql, postgres, mssql, cockroachdb
    |"time with time zone" // postgres, cockroachdb
    |"time without time zone" // postgres
    |"timestamp" // mysql, postgres, mssql, oracle, cockroachdb
    |"timestamp without time zone" // postgres, cockroachdb
    |"timestamp with time zone" // postgres, oracle, cockroachdb
    |"timestamp with local time zone"; // oracle

/**
 * Column types where column length is used.
 */
export type WithLengthColumnType = "character varying" // postgres, cockroachdb
    |"varying character" // sqlite
    |"char varying" // cockroachdb
    |"nvarchar" // mssql, mysql
    |"national varchar" // mysql
    |"character" // mysql, postgres, sqlite, cockroachdb
    |"native character" // sqlite
    |"varchar" // mysql, postgres, mssql, sqlite, cockroachdb
    |"char" // mysql, postgres, mssql, oracle, cockroachdb
    |"nchar" // mssql, oracle, sqlite, mysql
    |"national char" // mysql
    |"varchar2" // oracle
    |"nvarchar2" // oracle, sqlite
    |"raw" // oracle
    |"binary" // mssql
    |"varbinary" // mssql
    |"string"; // cockroachdb

export type WithWidthColumnType = "tinyint" // mysql
    |"smallint" // mysql
    |"mediumint" // mysql
    |"int" // mysql
    |"bigint"; // mysql

/**
 * All other regular column types.
 */
export type SimpleColumnType =

    "simple-array" // typeorm-specific, automatically mapped to string
    // |"string" // typeorm-specific, automatically mapped to varchar depend on platform

    |"simple-json" // typeorm-specific, automatically mapped to string

    |"simple-enum" // typeorm-specific, automatically mapped to string

    // numeric types
    |"bit" // mssql
    |"int2" // postgres, sqlite, cockroachdb
    |"integer" // postgres, oracle, sqlite, cockroachdb
    |"int4" // postgres, cockroachdb
    |"int8" // postgres, sqlite, cockroachdb
    |"int64" // cockroachdb
    |"unsigned big int" // sqlite
    |"float4" // postgres, cockroachdb
    |"float8" // postgres, cockroachdb
    |"smallmoney" // mssql
    |"money" // postgres, mssql

    // boolean types
    |"boolean" // postgres, sqlite, mysql, cockroachdb
    |"bool" // postgres, mysql, cockroachdb

    // text/binary types
    |"tinyblob" // mysql
    |"tinytext" // mysql
    |"mediumblob" // mysql
    |"mediumtext" // mysql
    |"blob" // mysql, oracle, sqlite, cockroachdb
    |"text" // mysql, postgres, mssql, sqlite, cockroachdb
    |"ntext" // mssql
    |"citext" // postgres
    |"hstore" // postgres
    |"longblob" // mysql
    |"longtext" // mysql
    |"bytes" // cockroachdb
    |"bytea" // postgres, cockroachdb
    |"long" // oracle
    |"raw" // oracle
    |"long raw" // oracle
    |"bfile" // oracle
    |"clob" // oracle, sqlite
    |"nclob" // oracle
    |"image" // mssql

    // date types
    |"timetz" // postgres
    |"timestamptz" // postgres, cockroachdb
    |"timestamp with local time zone" // oracle
    |"smalldatetime" // mssql
    |"date" // mysql, postgres, mssql, oracle, sqlite
    |"interval year to month" // oracle
    |"interval day to second" // oracle
    |"interval" // postgres, cockroachdb
    |"year" // mysql

    // geometric types
    |"point" // postgres, mysql
    |"line" // postgres
    |"lseg" // postgres
    |"box" // postgres
    |"circle" // postgres
    |"path" // postgres
    |"polygon" // postgres, mysql
    |"geography" // mssql
    |"geometry" // mysql
    |"linestring" // mysql
    |"multipoint" // mysql
    |"multilinestring" // mysql
    |"multipolygon" // mysql
    |"geometrycollection" // mysql

    // range types
    |"int4range" // postgres
    |"int8range" // postgres
    |"numrange" // postgres
    |"tsrange" // postgres
    |"tstzrange" // postgres
    |"daterange" // postgres

    // other types
    |"enum" // mysql, postgres
    |"cidr" // postgres
    |"inet" // postgres, cockroachdb
    |"macaddr"// postgres
    |"bit" // postgres
    |"bit varying" // postgres
    |"varbit"// postgres
    |"tsvector" // postgres
    |"tsquery" // postgres
    |"uuid" // postgres, cockroachdb
    |"xml" // mssql, postgres
    |"json" // mysql, postgres, cockroachdb
    |"jsonb" // postgres, cockroachdb
    |"varbinary" // mssql
    |"hierarchyid" // mssql
    |"sql_variant" // mssql
    |"rowid" // oracle
    |"urowid" // oracle
    |"uniqueidentifier" // mssql
    |"rowversion" // mssql
    |"array"; // cockroachdb

/**
 * Any column type column can be.
 */
export type ColumnType = WithPrecisionColumnType
    |WithLengthColumnType
    |WithWidthColumnType
    |SpatialColumnType
    |SimpleColumnType
    |BooleanConstructor
    |DateConstructor
    |NumberConstructor
    |StringConstructor;
