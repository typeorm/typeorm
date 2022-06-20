import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { CordovaConnectionOptions } from "./CordovaConnectionOptions";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { DataSource } from "../../data-source/DataSource";
import { ReplicationMode } from "../types/ReplicationMode";
export declare class CordovaDriver extends AbstractSqliteDriver {
    options: CordovaConnectionOptions;
    constructor(connection: DataSource);
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
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void;
}
