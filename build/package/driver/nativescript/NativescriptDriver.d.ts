import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { NativescriptConnectionOptions } from "./NativescriptConnectionOptions";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { DataSource } from "../../data-source/DataSource";
import { ColumnType } from "../types/ColumnTypes";
import { ReplicationMode } from "../types/ReplicationMode";
/**
 * Organizes communication with sqlite DBMS within Nativescript.
 */
export declare class NativescriptDriver extends AbstractSqliteDriver {
    /**
     * Connection options.
     */
    options: NativescriptConnectionOptions;
    /**
     * Nativescript driver module
     * this is most likely `nativescript-sqlite`
     * but user can pass his own
     */
    driver: any;
    constructor(connection: DataSource);
    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner;
    normalizeType(column: {
        type?: ColumnType;
        length?: number | string;
        precision?: number | null;
        scale?: number;
    }): string;
    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection(): Promise<void>;
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void;
}
