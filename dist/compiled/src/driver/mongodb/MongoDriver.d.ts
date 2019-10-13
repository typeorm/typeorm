import { Driver } from "../Driver";
import { MongoQueryRunner } from "./MongoQueryRunner";
import { ObjectLiteral } from "../../common/ObjectLiteral";
import { ColumnMetadata } from "../../metadata/ColumnMetadata";
import { Connection } from "../../connection/Connection";
import { MongoConnectionOptions } from "./MongoConnectionOptions";
import { MappedColumnTypes } from "../types/MappedColumnTypes";
import { ColumnType } from "../types/ColumnTypes";
import { MongoSchemaBuilder } from "../../schema-builder/MongoSchemaBuilder";
import { DataTypeDefaults } from "../types/DataTypeDefaults";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { ConnectionOptions } from "../../connection/ConnectionOptions";
import { EntityMetadata } from "../../metadata/EntityMetadata";
/**
 * Organizes communication with MongoDB.
 */
export declare class MongoDriver implements Driver {
    protected connection: Connection;
    /**
     * Underlying mongodb library.
     */
    mongodb: any;
    /**
     * Mongodb does not require to dynamically create query runner each time,
     * because it does not have a regular connection pool as RDBMS systems have.
     */
    queryRunner?: MongoQueryRunner;
    /**
     * Connection options.
     */
    options: MongoConnectionOptions;
    /**
     * Master database used to perform all write queries.
     */
    database?: string;
    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean;
    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport: boolean;
    /**
     * Mongodb does not need to have column types because they are not used in schema sync.
     */
    supportedDataTypes: ColumnType[];
    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[];
    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[];
    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[];
    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[];
    /**
     * Mongodb does not need to have a strong defined mapped column types because they are not used in schema sync.
     */
    mappedDataTypes: MappedColumnTypes;
    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;
    /**
     * No documentation specifying a maximum length for identifiers could be found
     * for MongoDB.
     */
    maxAliasLength?: number;
    /**
     * Valid mongo connection options
     * NOTE: Keep sync with MongoConnectionOptions
     * Sync with http://mongodb.github.io/node-mongodb-native/3.1/api/MongoClient.html
     */
    protected validOptionNames: string[];
    constructor(connection: Connection);
    /**
     * Performs connection to the database.
     */
    connect(): Promise<void>;
    afterConnect(): Promise<void>;
    /**
     * Closes connection with the database.
     */
    disconnect(): Promise<void>;
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder(): MongoSchemaBuilder;
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode?: "master" | "slave"): MongoQueryRunner;
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]];
    /**
     * Escapes a column name.
     */
    escape(columnName: string): string;
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     */
    buildTableName(tableName: string, schema?: string, database?: string): string;
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any;
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any;
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: {
        type?: ColumnType;
        length?: number | string;
        precision?: number | null;
        scale?: number;
    }): string;
    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string;
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean;
    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column: ColumnMetadata): string;
    /**
     * Normalizes "default" value of the column.
     */
    createFullType(column: TableColumn): string;
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any>;
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any>;
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertedId: any): any;
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[];
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean;
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean;
    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string;
    /**
     * Validate driver options to make sure everything is correct and driver will be able to establish connection.
     */
    protected validateOptions(options: ConnectionOptions): void;
    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): any;
    /**
     * Builds connection url that is passed to underlying driver to perform connection to the mongodb database.
     */
    protected buildConnectionUrl(): string;
    /**
     * Build connection options from MongoConnectionOptions
     */
    protected buildConnectionOptions(): any;
}
