"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoDriver = void 0;
const tslib_1 = require("tslib");
const AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
const ExpoQueryRunner_1 = require("./ExpoQueryRunner");
const DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
class ExpoDriver extends AbstractSqliteDriver_1.AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super(connection);
        this.database = this.options.database;
        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("database");
        if (!this.options.driver)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("driver");
        // load sqlite package
        this.sqlite = this.options.driver;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Closes connection with database.
     */
    disconnect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new ExpoQueryRunner_1.ExpoQueryRunner(this);
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
                    tsx.executeSql(`PRAGMA foreign_keys = ON;`, [], (t, result) => {
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
exports.ExpoDriver = ExpoDriver;

//# sourceMappingURL=ExpoDriver.js.map
