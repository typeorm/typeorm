import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { ExpoQueryRunner } from "./ExpoQueryRunner";
import { DriverOptionNotSetError } from "../../error/DriverOptionNotSetError";
export class ExpoDriver extends AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super(connection);
        this.database = this.options.database;
        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");
        if (!this.options.driver)
            throw new DriverOptionNotSetError("driver");
        // load sqlite package
        this.sqlite = this.options.driver;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Closes connection with database.
     */
    async disconnect() {
        return new Promise((ok, fail) => {
            try {
                this.queryRunner = undefined;
                this.databaseConnection._db.close();
                this.databaseConnection = undefined;
                ok();
            }
            catch (error) {
                fail(error);
            }
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new ExpoQueryRunner(this);
        return this.queryRunner;
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     */
    createDatabaseConnection() {
        return new Promise((ok, fail) => {
            try {
                const databaseConnection = this.sqlite.openDatabase(this.options.database);
                /*
                // we need to enable foreign keys in sqlite to make sure all foreign key related features
                // working properly. this also makes onDelete work with sqlite.
                */
                databaseConnection.transaction((tsx) => {
                    tsx.executeSql(`PRAGMA foreign_keys = ON`, [], (t, result) => {
                        ok(databaseConnection);
                    }, (t, err) => {
                        fail({ transaction: t, error: err });
                    });
                }, (err) => {
                    fail(err);
                });
            }
            catch (error) {
                fail(error);
            }
        });
    }
}

//# sourceMappingURL=ExpoDriver.js.map
