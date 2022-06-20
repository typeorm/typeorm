import { DataSource } from "../../data-source/DataSource";
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
    afterConnect(): Promise<void>;
    /**
     * For SQLite, the database may be added in the decorator metadata. It will be a filepath to a database file.
     */
    buildTableName(tableName: string, _schema?: string, database?: string): string;
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
    protected createDatabaseDirectory(dbPath: string): Promise<void>;
    /**
     * Performs the attaching of the database files. The attachedDatabase should have been populated during calls to #buildTableName
     * during EntityMetadata production (see EntityMetadata#buildTablePath)
     *
     * https://sqlite.org/lang_attach.html
     */
    protected attachDatabases(): Promise<void>;
    protected getMainDatabasePath(): string;
}
