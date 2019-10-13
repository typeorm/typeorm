import { Connection } from "../../connection/Connection";
import { SqliteConnectionOptions } from "./SqliteConnectionOptions";
import { ColumnType } from "../types/ColumnTypes";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
/**
 * Organizes communication with sqlite DBMS.
 */
export declare class SqliteDriver extends AbstractSqliteDriver {
    /**
     * Connection options.
     */
    options: SqliteConnectionOptions;
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
    createQueryRunner(mode?: "master" | "slave"): QueryRunner;
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
