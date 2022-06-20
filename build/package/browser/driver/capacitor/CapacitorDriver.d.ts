import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { CapacitorConnectionOptions } from "./CapacitorConnectionOptions";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { DataSource } from "../../data-source/DataSource";
import { ReplicationMode } from "../types/ReplicationMode";
export declare class CapacitorDriver extends AbstractSqliteDriver {
    driver: any;
    options: CapacitorConnectionOptions;
    constructor(connection: DataSource);
    /**
     * Performs connection to the database.
     */
    connect(): Promise<void>;
    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner;
    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection(): Promise<any>;
    protected loadDependencies(): void;
}
