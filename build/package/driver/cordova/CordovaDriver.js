"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CordovaDriver = void 0;
const AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
const CordovaQueryRunner_1 = require("./CordovaQueryRunner");
const DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
const DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
class CordovaDriver extends AbstractSqliteDriver_1.AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super(connection);
        // this.connection = connection;
        // this.options = connection.options as CordovaConnectionOptions;
        this.database = this.options.database;
        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("database");
        if (!this.options.location)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("location");
        // load sqlite package
        this.loadDependencies();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Closes connection with database.
     */
    async disconnect() {
        this.queryRunner = undefined;
        return new Promise((ok, fail) => {
            this.databaseConnection.close(ok, fail);
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new CordovaQueryRunner_1.CordovaQueryRunner(this);
        return this.queryRunner;
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     */
    async createDatabaseConnection() {
        const options = Object.assign({}, {
            name: this.options.database,
            location: this.options.location,
        }, this.options.extra || {});
        const connection = await new Promise((resolve) => {
            this.sqlite.openDatabase(options, (db) => resolve(db));
        });
        await new Promise((ok, fail) => {
            // we need to enable foreign keys in sqlite to make sure all foreign key related features
            // working properly. this also makes onDelete to work with sqlite.
            connection.executeSql(`PRAGMA foreign_keys = ON`, [], () => ok(), (err) => fail(err));
        });
        return connection;
    }
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    loadDependencies() {
        try {
            const sqlite = this.options.driver || window.sqlitePlugin;
            this.sqlite = sqlite;
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("Cordova-SQLite", "cordova-sqlite-storage");
        }
    }
}
exports.CordovaDriver = CordovaDriver;

//# sourceMappingURL=CordovaDriver.js.map
