import {DriverOptions} from "./DriverOptions";
import {QueryRunner} from "../query-runner/QueryRunner";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";

/**
 * Driver organizes TypeORM communication with specific database management system.
 */
export interface Driver {

    /**
     * Naming strategy used in the connection where this driver is used.
     */
    namingStrategy: NamingStrategyInterface;

    /**
     * Driver options contains connectivity options used to connection to the database.
     */
    readonly options: DriverOptions;

    /**
     * Creates repository instance of this driver.
     */
    // createRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): Repository<any>;

    /**
     * Creates tree repository instance of this driver.
     */
    // createTreeRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): TreeRepository<any>;

    /**
     * Creates specific repository instance of this driver.
     */
    // createSpecificRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): SpecificRepository<any>;

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void>;

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface(): any;

    /**
     * Creates a query runner used for common queries.
     */
    createQueryRunner(): Promise<QueryRunner>;

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]];

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string;

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string;

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string;

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any;

    /**
     * Prepares given value to a value to be persisted, based on its column metadata.
     */
    prepareHydratedValue(value: any, type: ColumnMetadata): any;

    /**
     * Prepares given value to a value to be persisted, based on its column type.
     */
    prepareHydratedValue(value: any, column: ColumnMetadata): any;


}