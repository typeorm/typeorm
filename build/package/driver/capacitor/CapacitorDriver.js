"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacitorDriver = void 0;
const AbstractSqliteDriver_1 = require("../sqlite-abstract/AbstractSqliteDriver");
const CapacitorQueryRunner_1 = require("./CapacitorQueryRunner");
const error_1 = require("../../error");
class CapacitorDriver extends AbstractSqliteDriver_1.AbstractSqliteDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super(connection);
        this.database = this.options.database;
        this.driver = this.options.driver;
        // validate options to make sure everything is set
        if (!this.options.database)
            throw new error_1.DriverOptionNotSetError("database");
        if (!this.options.driver)
            throw new error_1.DriverOptionNotSetError("driver");
        // load sqlite package
        this.sqlite = this.options.driver;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     */
    async connect() {
        this.databaseConnection = this.createDatabaseConnection();
        await this.databaseConnection;
    }
    /**
     * Closes connection with database.
     */
    async disconnect() {
        this.queryRunner = undefined;
        const databaseConnection = await this.databaseConnection;
        return databaseConnection.close().then(() => {
            this.databaseConnection = undefined;
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        if (!this.queryRunner)
            this.queryRunner = new CapacitorQueryRunner_1.CapacitorQueryRunner(this);
        return this.queryRunner;
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates connection with the database.
     */
    async createDatabaseConnection() {
        const databaseMode = this.options.mode || "no-encryption";
        const isDatabaseEncryted = databaseMode !== "no-encryption";
        const databaseVersion = typeof this.options.version === "undefined"
            ? 1
            : this.options.version;
        const connection = await this.sqlite.createConnection(this.options.database, isDatabaseEncryted, databaseMode, databaseVersion);
        await connection.open();
        // we need to enable foreign keys in sqlite to make sure all foreign key related features
        // working properly. this also makes onDelete to work with sqlite.
        await connection.query(`PRAGMA foreign_keys = ON`);
        if (this.options.journalMode &&
            ["DELETE", "TRUNCATE", "PERSIST", "MEMORY", "WAL", "OFF"].indexOf(this.options.journalMode) !== -1) {
            await connection.query(`PRAGMA journal_mode = ${this.options.journalMode}`);
        }
        return connection;
    }
    loadDependencies() {
        this.sqlite = this.driver;
        if (!this.driver) {
            throw new error_1.DriverPackageNotInstalledError("Capacitor", "@capacitor-community/sqlite");
        }
    }
}
exports.CapacitorDriver = CapacitorDriver;

//# sourceMappingURL=CapacitorDriver.js.map
