import { __awaiter } from "tslib";
import mkdirp from 'mkdirp';
import path from 'path';
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { SqliteQueryRunner } from "./SqliteQueryRunner";
import { DriverOptionNotSetError } from "../../error/DriverOptionNotSetError";
import { PlatformTools } from "../../platform/PlatformTools";
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
/**
 * Organizes communication with sqlite DBMS.
 */
export class SqliteDriver extends AbstractSqliteDriver {
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
            return new Promise((ok, fail) => {
                this.queryRunner = undefined;
                this.databaseConnection.close((err) => err ? fail(err) : ok());
            });
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new SqliteQueryRunner(this);
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
            yield this.createDatabaseDirectory(this.options.database);
            const databaseConnection = yield new Promise((ok, fail) => {
                const connection = new this.sqlite.Database(this.options.database, (err) => {
                    if (err)
                        return fail(err);
                    ok(connection);
                });
            });
            // Internal function to run a command on the connection and fail if an error occured.
            function run(line) {
                return new Promise((ok, fail) => {
                    databaseConnection.run(line, (err) => {
                        if (err)
                            return fail(err);
                        ok();
                    });
                });
            }
            if (this.options.enableWAL) {
                yield run(`PRAGMA journal_mode = WAL;`);
            }
            // we need to enable foreign keys in sqlite to make sure all foreign key related features
            // working properly. this also makes onDelete to work with sqlite.
            yield run(`PRAGMA foreign_keys = ON;`);
            // in the options, if encryption key for SQLCipher is setted.
            if (this.options.key) {
                yield run(`PRAGMA key = ${JSON.stringify(this.options.key)};`);
            }
            return databaseConnection;
        });
    }
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    loadDependencies() {
        try {
            this.sqlite = PlatformTools.load("sqlite3").verbose();
        }
        catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "sqlite3");
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

//# sourceMappingURL=SqliteDriver.js.map
