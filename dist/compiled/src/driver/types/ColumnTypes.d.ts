/**
 * Column types used for @PrimaryGeneratedColumn() decorator.
 */
export declare type PrimaryGeneratedColumnType = "int" | "int2" | "int4" | "int8" | "integer" | "tinyint" | "smallint" | "mediumint" | "bigint" | "dec" | "decimal" | "fixed" | "numeric" | "number" | "uuid";
/**
 * Column types where spatial properties are used.
 */
export declare type SpatialColumnType = "geometry" | "geography";
/**
 * Column types where precision and scale properties are used.
 */
export declare type WithPrecisionColumnType = "float" | "double" | "dec" | "decimal" | "fixed" | "numeric" | "real" | "double precision" | "number" | "datetime" | "datetime2" | "datetimeoffset" | "time" | "time with time zone" | "time without time zone" | "timestamp" | "timestamp without time zone" | "timestamp with time zone" | "timestamp with local time zone";
/**
 * Column types where column length is used.
 */
export declare type WithLengthColumnType = "character varying" | "varying character" | "char varying" | "nvarchar" | "national varchar" | "character" | "native character" | "varchar" | "char" | "nchar" | "national char" | "varchar2" | "nvarchar2" | "raw" | "binary" | "varbinary" | "string";
export declare type WithWidthColumnType = "tinyint" | "smallint" | "mediumint" | "int" | "bigint";
/**
 * All other regular column types.
 */
export declare type SimpleColumnType = "simple-array" | "simple-json" | "simple-enum" | "bit" | "int2" | "integer" | "int4" | "int8" | "int64" | "unsigned big int" | "float4" | "float8" | "smallmoney" | "money" | "boolean" | "bool" | "tinyblob" | "tinytext" | "mediumblob" | "mediumtext" | "blob" | "text" | "ntext" | "citext" | "hstore" | "longblob" | "longtext" | "bytes" | "bytea" | "long" | "raw" | "long raw" | "bfile" | "clob" | "nclob" | "image" | "timetz" | "timestamptz" | "timestamp with local time zone" | "smalldatetime" | "date" | "interval year to month" | "interval day to second" | "interval" | "year" | "point" | "line" | "lseg" | "box" | "circle" | "path" | "polygon" | "geography" | "geometry" | "linestring" | "multipoint" | "multilinestring" | "multipolygon" | "geometrycollection" | "int4range" | "int8range" | "numrange" | "tsrange" | "tstzrange" | "daterange" | "enum" | "set" | "cidr" | "inet" | "macaddr" | "bit" | "bit varying" | "varbit" | "tsvector" | "tsquery" | "uuid" | "xml" | "json" | "jsonb" | "varbinary" | "hierarchyid" | "sql_variant" | "rowid" | "urowid" | "uniqueidentifier" | "rowversion" | "array" | "cube";
/**
 * Any column type column can be.
 */
export declare type ColumnType = WithPrecisionColumnType | WithLengthColumnType | WithWidthColumnType | SpatialColumnType | SimpleColumnType | BooleanConstructor | DateConstructor | NumberConstructor | StringConstructor;
