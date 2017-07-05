import {QueryRunner} from "../query-runner/QueryRunner";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ColumnType} from "./types/ColumnTypes";
import {MappedColumnTypes} from "./types/MappedColumnTypes";
import {SchemaBuilder} from "../schema-builder/SchemaBuilder";
import {DataTypeDefaults} from "./types/DataTypeDefaults";
import {BaseConnectionOptions} from "../connection/BaseConnectionOptions";

/**
 * Driver organizes TypeORM communication with specific database management system.
 */
export interface Driver {

    /**
     * Connection options.
     */
    options: BaseConnectionOptions;

    /**
     * Gets list of supported column data types by a driver.
     */
    supportedDataTypes: ColumnType[];

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes;

    /**
     * Performs connection to the database.
     * Depend on driver type it may create a connection pool.
     */
    connect(): Promise<void>;

    /**
     * Closes connection with database and releases all resourc.
     */
    disconnect(): Promise<void>;

    /**
     * Synchronizes database schema (creates tables, indices, etc).
     */
    createSchemaBuilder(): SchemaBuilder;

    /**
     * Creates a query runner used for common queries.
     */
    createQueryRunner(): QueryRunner;

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]];

    /**
     * Escapes a table name, column name or an alias.
     */
    escape(tableName: string): string;

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any;

    /**
     * Prepares given value to a value to be persisted, based on its column type.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any;

    /**
     * Transforms type of the given column to a database column type.
     */
    normalizeType(column: { type?: ColumnType, length?: number, precision?: number, scale?: number, isArray?: boolean }): string;

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(column: ColumnMetadata): string;

}