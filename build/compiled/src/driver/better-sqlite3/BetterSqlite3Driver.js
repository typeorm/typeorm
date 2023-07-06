"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetterSqlite3Driver = void 0;
const tslib_1 = require("tslib");
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
const path_1 = tslib_1.__importDefault(require("path"));
const DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
const DriverOptionNotSetError_1 = require("../../error/DriverOptionNotSetError");
const PlatformTools_1 = require("../../platform/PlatformTools");
const AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
const BetterSqlite3QueryRunner_1 = require("./BetterSqlite3QueryRunner");
/**
 * Organizes communication with sqlite DBMS.
 */
class BetterSqlite3Driver extends AbstractSqliteDriver_1.AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super(connection);
        this.connection = connection;
        this.options = connection.options;
        this.database = this.options.database;
        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError_1.DriverOptionNotSetError("database");
        // load sqlite package
        this.loadDependencies();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Closes connection with database.
     */
    disconnect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.queryRunner = undefined;
            this.databaseConnection.close();
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new BetterSqlite3QueryRunner_1.BetterSqlite3QueryRunner(this);
        return this.queryRunner;
    }
    normalizeType(column) {
        if (column.type === Buffer) {
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
    createDatabaseConnection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // not to create database directory if is in memory
            if (this.options.database !== ":memory:")
                yield this.createDatabaseDirectory(this.options.database);
            const { database, readonly = false, fileMustExist = false, timeout = 5000, verbose = null, prepareDatabase } = this.options;
            const databaseConnection = this.sqlite(database, { readonly, fileMustExist, timeout, verbose });
            // we need to enable foreign keys in sqlite to make sure all foreign key related features
            // working properly. this also makes onDelete to work with sqlite.
            databaseConnection.exec(`PRAGMA foreign_keys = ON`);
            // turn on WAL mode to enhance performance
            databaseConnection.exec(`PRAGMA journal_mode = WAL`);
            // in the options, if encryption key for SQLCipher is setted.
            if (this.options.key) {
                databaseConnection.exec(`PRAGMA key = ${JSON.stringify(this.options.key)}`);
            }
            if (typeof prepareDatabase === "function") {
                prepareDatabase(databaseConnection);
            }
            return databaseConnection;
        });
    }
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    loadDependencies() {
        try {
            this.sqlite = PlatformTools_1.PlatformTools.load("better-sqlite3");
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("SQLite", "better-sqlite3");
        }
    }
    /**
     * Auto creates database directory if it does not exist.
     */
    createDatabaseDirectory(fullPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield (0, mkdirp_1.default)(path_1.default.dirname(fullPath));
        });
    }
}
exports.BetterSqlite3Driver = BetterSqlite3Driver;
//# sourceMappingURL=BetterSqlite3Driver.js.map