import { ColumnType, Connection, DriverOptionNotSetError, QueryRunner } from "@typeorm/core";
import { SqliteQueryRunner } from "./SqliteQueryRunner";
import { SqliteConnectionOptions } from "./SqliteConnectionOptions";
import { AbstractSqliteDriver } from "@typeorm/driver-sqlite-abstract";
import { Database } from 'sqlite3';
import * as mkdirp from 'mkdirp';
import { dirname } from 'path';

/**
 * Organizes communication with sqlite DBMS.
 */
export class SqliteDriver extends AbstractSqliteDriver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: SqliteConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        this.connection = connection;
        this.options = connection.options as SqliteConnectionOptions;
        this.database = this.options.database;

        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master" | "slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new SqliteQueryRunner(this);

        return this.queryRunner;
    }

    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number | null, scale?: number }): string {
        if ((column.type as any) === Buffer) {
            return "blob";
        }

        return super.normalizeType(column);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected async createDatabaseConnection() {
        await this.createDatabaseDirectory(this.options.database);

        const databaseConnection: any = await new Promise((ok, fail) => {
            const connection = new Database(this.options.database, (err: any) => {
                if (err) return fail(err);
                ok(connection);
            });
        });

        // Internal function to run a command on the connection and fail if an error occured.
        function run(line: string): Promise<void> {
            return new Promise((ok, fail) => {
                databaseConnection.run(line, (err: any) => {
                    if (err) return fail(err);
                    ok();
                });
            });
        }

        // we need to enable foreign keys in sqlite to make sure all foreign key related features
        // working properly. this also makes onDelete to work with sqlite.
        await run(`PRAGMA foreign_keys = ON;`);

        // in the options, if encryption key for SQLCipher is setted.
        if (this.options.key) {
            await run(`PRAGMA key = ${JSON.stringify(this.options.key)};`);
        }

        return databaseConnection;
    }

    /**
     * Auto creates database directory if it does not exist.
     */
    protected createDatabaseDirectory(fullPath: string): Promise<void> {
        return mkdirp(dirname(fullPath));
    }

}
