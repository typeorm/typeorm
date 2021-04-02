import { Connection } from "../../connection/Connection";
import { ColumnType } from "../types/ColumnTypes";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { BetterSqlite3ConnectionOptions } from "./BetterSqlite3ConnectionOptions";
import { ReplicationMode } from "../types/ReplicationMode";
/**
 * Organizes communication with sqlite DBMS.
 */
export declare class BetterSqlite3Driver extends AbstractSqliteDriver {
    /**
     * Connection options.
     */
    options: BetterSqlite3ConnectionOptions;
    /**
     * SQLite underlying library.
     */
    sqlite: any;
    constructor(connection: Connection);
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
    protected createDatabaseConnection(): Promise<any>;
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void;
    /**
     * Auto creates database directory if it does not exist.
     */
    protected createDatabaseDirectory(fullPath: string): Promise<void>;
}
