import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {SqliteQueryRunner} from "./SqliteQueryRunner";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {SqliteConnectionOptions} from "./SqliteConnectionOptions";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";

/**
 * Organizes communication with sqlite DBMS.
 */
export class SqliteDriver extends AbstractSqliteDriver {
    /**
     * Connection options.
     */
    options: SqliteConnectionOptions;

    /**
     * SQLite underlying library.
     */
    sqlite: any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        this.connection = connection;
        this.options = connection.options as SqliteConnectionOptions;

        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load sqlite package
        this.loadDependencies();
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
    createQueryRunner(): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new SqliteQueryRunner(this);

        return this.queryRunner;
    }

    normalizeType(column: { type?: ColumnType, length?: number, precision?: number, scale?: number }): string {
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
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            const databaseConnection = new this.sqlite.Database(this.options.database, (err: any) => {
                if (err) return fail(err);

                // we need to enable foreign keys in sqlite to make sure all foreign key related features
                // working properly. this also makes onDelete to work with sqlite.
                databaseConnection.run(`PRAGMA foreign_keys = ON;`, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(databaseConnection);
                });
            });
        });
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = PlatformTools.load("sqlite3").verbose();

        } catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "sqlite3");
        }
    }

}