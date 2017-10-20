import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";
import {CordovaConnectionOptions} from "./CordovaConnectionOptions";
import {CordovaQueryRunner} from "./CordovaQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {Connection} from "../../connection/Connection";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";

// needed for typescript compiler
interface Window {
    sqlitePlugin: any;
}

declare var window: Window;

export class CordovaDriver extends AbstractSqliteDriver {
    options: CordovaConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        // this.connection = connection;
        // this.options = connection.options as CordovaConnectionOptions;
        this.database = this.options.database;

        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        if (!this.options.location)
            throw new DriverOptionNotSetError("location");

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
            this.databaseConnection.close(ok, fail);
        });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master"|"slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new CordovaQueryRunner(this);

        return this.queryRunner;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            this.sqlite.openDatabase(
                this.options.password === undefined ?
                    {name: this.options.database, location: this.options.location} :
                    {name: this.options.database, location: this.options.location, key: this.options.password},
                (db: any) => {
                    const databaseConnection = db;
                    ok(databaseConnection);
                },
                (error: any) => {
                    fail(error);
                }
            );
        });
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = window.sqlitePlugin;

        } catch (e) {
            throw new DriverPackageNotInstalledError("Cordova-SQLite", "cordova-sqlite-storage");
        }
    }
}