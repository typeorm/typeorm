import { __awaiter } from "tslib";
import mkdirp from 'mkdirp';
import path from 'path';
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { DriverOptionNotSetError } from "../../error/DriverOptionNotSetError";
import { PlatformTools } from "../../platform/PlatformTools";
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { BetterSqlite3QueryRunner } from "./BetterSqlite3QueryRunner";
/**
 * Organizes communication with sqlite DBMS.
 */
export class BetterSqlite3Driver extends AbstractSqliteDriver {
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
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.queryRunner = undefined;
            this.databaseConnection.close();
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new BetterSqlite3QueryRunner(this);
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
        return __awaiter(this, void 0, void 0, function* () {
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
            this.sqlite = PlatformTools.load("better-sqlite3");
        }
        catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "better-sqlite3");
        }
    }
    /**
     * Auto creates database directory if it does not exist.
     */
    createDatabaseDirectory(fullPath) {
        return __awaiter(this, void 0, void 0, function* () {
            yield mkdirp(path.dirname(fullPath));
        });
    }
}

//# sourceMappingURL=BetterSqlite3Driver.js.map
