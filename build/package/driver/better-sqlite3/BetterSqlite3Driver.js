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
const PathUtils_1 = require("../../util/PathUtils");
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
    async disconnect() {
        this.queryRunner = undefined;
        this.databaseConnection.close();
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
    async afterConnect() {
        return this.attachDatabases();
    }
    /**
     * For SQLite, the database may be added in the decorator metadata. It will be a filepath to a database file.
     */
    buildTableName(tableName, _schema, database) {
        if (!database)
            return tableName;
        if (this.getAttachedDatabaseHandleByRelativePath(database))
            return `${this.getAttachedDatabaseHandleByRelativePath(database)}.${tableName}`;
        if (database === this.options.database)
            return tableName;
        // we use the decorated name as supplied when deriving attach handle (ideally without non-portable absolute path)
        const identifierHash = (0, PathUtils_1.filepathToName)(database);
        // decorated name will be assumed relative to main database file when non absolute. Paths supplied as absolute won't be portable
        const absFilepath = (0, PathUtils_1.isAbsolute)(database)
            ? database
            : path_1.default.join(this.getMainDatabasePath(), database);
        this.attachedDatabases[database] = {
            attachFilepathAbsolute: absFilepath,
            attachFilepathRelative: database,
            attachHandle: identifierHash,
        };
        return `${identifierHash}.${tableName}`;
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     */
    async createDatabaseConnection() {
        // not to create database directory if is in memory
        if (this.options.database !== ":memory:")
            await this.createDatabaseDirectory(path_1.default.dirname(this.options.database));
        const { database, readonly = false, fileMustExist = false, timeout = 5000, verbose = null, prepareDatabase, } = this.options;
        const databaseConnection = this.sqlite(database, {
            readonly,
            fileMustExist,
            timeout,
            verbose,
        });
        // in the options, if encryption key for SQLCipher is setted.
        // Must invoke key pragma before trying to do any other interaction with the database.
        if (this.options.key) {
            databaseConnection.exec(`PRAGMA key = ${JSON.stringify(this.options.key)}`);
        }
        // function to run before a database is used in typeorm.
        if (typeof prepareDatabase === "function") {
            prepareDatabase(databaseConnection);
        }
        // we need to enable foreign keys in sqlite to make sure all foreign key related features
        // working properly. this also makes onDelete to work with sqlite.
        databaseConnection.exec(`PRAGMA foreign_keys = ON`);
        // turn on WAL mode to enhance performance
        databaseConnection.exec(`PRAGMA journal_mode = WAL`);
        return databaseConnection;
    }
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    loadDependencies() {
        try {
            const sqlite = this.options.driver || PlatformTools_1.PlatformTools.load("better-sqlite3");
            this.sqlite = sqlite;
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("SQLite", "better-sqlite3");
        }
    }
    /**
     * Auto creates database directory if it does not exist.
     */
    async createDatabaseDirectory(dbPath) {
        await (0, mkdirp_1.default)(dbPath);
    }
    /**
     * Performs the attaching of the database files. The attachedDatabase should have been populated during calls to #buildTableName
     * during EntityMetadata production (see EntityMetadata#buildTablePath)
     *
     * https://sqlite.org/lang_attach.html
     */
    async attachDatabases() {
        // @todo - possibly check number of databases (but unqueriable at runtime sadly) - https://www.sqlite.org/limits.html#max_attached
        for await (const { attachHandle, attachFilepathAbsolute, } of Object.values(this.attachedDatabases)) {
            await this.createDatabaseDirectory(path_1.default.dirname(attachFilepathAbsolute));
            await this.connection.query(`ATTACH "${attachFilepathAbsolute}" AS "${attachHandle}"`);
        }
    }
    getMainDatabasePath() {
        const optionsDb = this.options.database;
        return path_1.default.dirname((0, PathUtils_1.isAbsolute)(optionsDb)
            ? optionsDb
            : path_1.default.join(this.options.baseDirectory, optionsDb));
    }
}
exports.BetterSqlite3Driver = BetterSqlite3Driver;

//# sourceMappingURL=BetterSqlite3Driver.js.map
