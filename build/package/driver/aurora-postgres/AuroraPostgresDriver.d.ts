import { Driver } from "../Driver";
import { PostgresDriver } from "../postgres/PostgresDriver";
import { DataSource } from "../../data-source/DataSource";
import { AuroraPostgresConnectionOptions } from "./AuroraPostgresConnectionOptions";
import { AuroraPostgresQueryRunner } from "./AuroraPostgresQueryRunner";
import { ReplicationMode } from "../types/ReplicationMode";
import { ColumnMetadata } from "../../metadata/ColumnMetadata";
declare abstract class PostgresWrapper extends PostgresDriver {
    options: any;
    abstract createQueryRunner(mode: ReplicationMode): any;
}
export declare class AuroraPostgresDriver extends PostgresWrapper implements Driver {
    /**
     * Connection used by driver.
     */
    connection: DataSource;
    /**
     * Aurora Data API underlying library.
     */
    DataApiDriver: any;
    client: any;
    /**
     * Represent transaction support by this driver
     */
    transactionSupport: "nested";
    /**
     * Connection options.
     */
    options: AuroraPostgresConnectionOptions;
    /**
     * Master database used to perform all write queries.
     */
    database?: string;
    constructor(connection: DataSource);
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
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): AuroraPostgresQueryRunner;
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any;
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any;
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void;
    /**
     * Executes given query.
     */
    protected executeQuery(connection: any, query: string): Promise<any>;
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    afterConnect(): Promise<void>;
}
export {};
