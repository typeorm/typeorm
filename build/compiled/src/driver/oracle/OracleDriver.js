"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleDriver = void 0;
const tslib_1 = require("tslib");
const ConnectionIsNotSetError_1 = require("../../error/ConnectionIsNotSetError");
const DriverPackageNotInstalledError_1 = require("../../error/DriverPackageNotInstalledError");
const OracleQueryRunner_1 = require("./OracleQueryRunner");
const DateUtils_1 = require("../../util/DateUtils");
const PlatformTools_1 = require("../../platform/PlatformTools");
const RdbmsSchemaBuilder_1 = require("../../schema-builder/RdbmsSchemaBuilder");
const DriverUtils_1 = require("../DriverUtils");
const OrmUtils_1 = require("../../util/OrmUtils");
const ApplyValueTransformers_1 = require("../../util/ApplyValueTransformers");
/**
 * Organizes communication with Oracle RDBMS.
 */
class OracleDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        /**
         * Pool for slave databases.
         * Used in replication.
         */
        this.slaves = [];
        /**
         * Indicates if replication is enabled.
         */
        this.isReplicated = false;
        /**
         * Indicates if tree tables are supported by this driver.
         */
        this.treeSupport = true;
        /**
         * Gets list of supported column data types by a driver.
         *
         * @see https://www.techonthenet.com/oracle/datatypes.php
         * @see https://docs.oracle.com/cd/B28359_01/server.111/b28318/datatype.htm#CNCPT012
         */
        this.supportedDataTypes = [
            "char",
            "nchar",
            "nvarchar2",
            "varchar2",
            "long",
            "raw",
            "long raw",
            "number",
            "numeric",
            "float",
            "dec",
            "decimal",
            "integer",
            "int",
            "smallint",
            "real",
            "double precision",
            "date",
            "timestamp",
            "timestamp with time zone",
            "timestamp with local time zone",
            "interval year to month",
            "interval day to second",
            "bfile",
            "blob",
            "clob",
            "nclob",
            "rowid",
            "urowid"
        ];
        /**
         * Gets list of spatial column data types.
         */
        this.spatialTypes = [];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withLengthColumnTypes = [
            "char",
            "nchar",
            "nvarchar2",
            "varchar2",
            "varchar",
            "raw"
        ];
        /**
         * Gets list of column data types that support precision by a driver.
         */
        this.withPrecisionColumnTypes = [
            "number",
            "float",
            "timestamp",
            "timestamp with time zone",
            "timestamp with local time zone"
        ];
        /**
         * Gets list of column data types that support scale by a driver.
         */
        this.withScaleColumnTypes = [
            "number"
        ];
        /**
         * Orm has special columns and we need to know what database column types should be for those types.
         * Column types are driver dependant.
         */
        this.mappedDataTypes = {
            createDate: "timestamp",
            createDateDefault: "CURRENT_TIMESTAMP",
            updateDate: "timestamp",
            updateDateDefault: "CURRENT_TIMESTAMP",
            deleteDate: "timestamp",
            deleteDateNullable: true,
            version: "number",
            treeLevel: "number",
            migrationId: "number",
            migrationName: "varchar2",
            migrationTimestamp: "number",
            cacheId: "number",
            cacheIdentifier: "varchar2",
            cacheTime: "number",
            cacheDuration: "number",
            cacheQuery: "clob",
            cacheResult: "clob",
            metadataType: "varchar2",
            metadataDatabase: "varchar2",
            metadataSchema: "varchar2",
            metadataTable: "varchar2",
            metadataName: "varchar2",
            metadataValue: "clob",
        };
        /**
         * Default values of length, precision and scale depends on column data type.
         * Used in the cases when length/precision/scale is not specified by user.
         */
        this.dataTypeDefaults = {
            "char": { length: 1 },
            "nchar": { length: 1 },
            "varchar": { length: 255 },
            "varchar2": { length: 255 },
            "nvarchar2": { length: 255 },
            "raw": { length: 2000 },
            "float": { precision: 126 },
            "timestamp": { precision: 6 },
            "timestamp with time zone": { precision: 6 },
            "timestamp with local time zone": { precision: 6 }
        };
        /**
         * Max length allowed by Oracle for aliases.
         * @see https://docs.oracle.com/database/121/SQLRF/sql_elements008.htm#SQLRF51129
         * > The following list of rules applies to both quoted and nonquoted identifiers unless otherwise indicated
         * > Names must be from 1 to 30 bytes long with these exceptions:
         * > [...]
         *
         * Since Oracle 12.2 (with a compatible driver/client), the limit has been set to 128.
         * @see https://docs.oracle.com/en/database/oracle/oracle-database/12.2/sqlrf/Database-Object-Names-and-Qualifiers.html
         *
         * > If COMPATIBLE is set to a value of 12.2 or higher, then names must be from 1 to 128 bytes long with these exceptions
         */
        this.maxAliasLength = 30;
        this.connection = connection;
        this.options = connection.options;
        if (this.options.useUTC === true) {
            process.env.ORA_SDTZ = 'UTC';
        }
        // load oracle package
        this.loadDependencies();
        // extra oracle setup
        this.oracle.outFormat = this.oracle.OBJECT;
        // Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.sid)
        //     throw new DriverOptionNotSetError("sid");
        //
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.oracle.fetchAsString = [this.oracle.CLOB];
            this.oracle.fetchAsBuffer = [this.oracle.BLOB];
            if (this.options.replication) {
                this.slaves = yield Promise.all(this.options.replication.slaves.map(slave => {
                    return this.createPool(this.options, slave);
                }));
                this.master = yield this.createPool(this.options, this.options.replication.master);
                this.database = this.options.replication.master.database;
            }
            else {
                this.master = yield this.createPool(this.options, this.options);
                this.database = this.options.database;
            }
        });
    }
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    afterConnect() {
        return Promise.resolve();
    }
    /**
     * Closes connection with the database.
     */
    disconnect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.master)
                return Promise.reject(new ConnectionIsNotSetError_1.ConnectionIsNotSetError("oracle"));
            yield this.closePool(this.master);
            yield Promise.all(this.slaves.map(slave => this.closePool(slave)));
            this.master = undefined;
            this.slaves = [];
        });
    }
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder_1.RdbmsSchemaBuilder(this.connection);
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        return new OracleQueryRunner_1.OracleQueryRunner(this, mode);
    }
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql, parameters, nativeParameters) {
        const escapedParameters = Object.keys(nativeParameters).map(key => {
            if (typeof nativeParameters[key] === "boolean")
                return nativeParameters[key] ? 1 : 0;
            return nativeParameters[key];
        });
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];
        const keys = Object.keys(parameters).map(parameter => "(:(\\.\\.\\.)?" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key) => {
            let value;
            let isArray = false;
            if (key.substr(0, 4) === ":...") {
                isArray = true;
                value = parameters[key.substr(4)];
            }
            else {
                value = parameters[key.substr(1)];
            }
            if (isArray) {
                return value.map((v, index) => {
                    escapedParameters.push(v);
                    return `:${key.substr(4)}${index}`;
                }).join(", ");
            }
            else if (value instanceof Function) {
                return value();
            }
            else if (typeof value === "boolean") {
                return value ? 1 : 0;
            }
            else {
                escapedParameters.push(value);
                return key;
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }
    /**
     * Escapes a column name.
     */
    escape(columnName) {
        return `"${columnName}"`;
    }
    /**
     * Build full table name with database name, schema name and table name.
     * Oracle does not support table schemas. One user can have only one schema.
     */
    buildTableName(tableName, schema, database) {
        return tableName;
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        if (value === null || value === undefined)
            return value;
        if (columnMetadata.type === Boolean) {
            return value ? 1 : 0;
        }
        else if (columnMetadata.type === "date") {
            if (typeof value === "string")
                value = value.replace(/[^0-9-]/g, "");
            return () => `TO_DATE('${DateUtils_1.DateUtils.mixedDateToDateString(value)}', 'YYYY-MM-DD')`;
        }
        else if (columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp with local time zone") {
            return DateUtils_1.DateUtils.mixedDateToDate(value);
        }
        else if (columnMetadata.type === "simple-array") {
            return DateUtils_1.DateUtils.simpleArrayToString(value);
        }
        else if (columnMetadata.type === "simple-json") {
            return DateUtils_1.DateUtils.simpleJsonToString(value);
        }
        return value;
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value, columnMetadata) {
        if (value === null || value === undefined)
            return columnMetadata.transformer ? ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value) : value;
        if (columnMetadata.type === Boolean) {
            value = !!value;
        }
        else if (columnMetadata.type === "date") {
            value = DateUtils_1.DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "time") {
            value = DateUtils_1.DateUtils.mixedTimeToString(value);
        }
        else if (columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp with local time zone") {
            value = DateUtils_1.DateUtils.normalizeHydratedDate(value);
        }
        else if (columnMetadata.type === "json") {
            value = JSON.parse(value);
        }
        else if (columnMetadata.type === "simple-array") {
            value = DateUtils_1.DateUtils.stringToSimpleArray(value);
        }
        else if (columnMetadata.type === "simple-json") {
            value = DateUtils_1.DateUtils.stringToSimpleJson(value);
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column) {
        if (column.type === Number || column.type === Boolean || column.type === "numeric"
            || column.type === "dec" || column.type === "decimal" || column.type === "int"
            || column.type === "integer" || column.type === "smallint") {
            return "number";
        }
        else if (column.type === "real" || column.type === "double precision") {
            return "float";
        }
        else if (column.type === String || column.type === "varchar") {
            return "varchar2";
        }
        else if (column.type === Date) {
            return "timestamp";
        }
        else if (column.type === Buffer) {
            return "blob";
        }
        else if (column.type === "uuid") {
            return "varchar2";
        }
        else if (column.type === "simple-array") {
            return "clob";
        }
        else if (column.type === "simple-json") {
            return "clob";
        }
        else {
            return column.type || "";
        }
    }
    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata) {
        const defaultValue = columnMetadata.default;
        if (typeof defaultValue === "number") {
            return "" + defaultValue;
        }
        else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "1" : "0";
        }
        else if (typeof defaultValue === "function") {
            return defaultValue();
        }
        else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;
        }
        else if (defaultValue === null) {
            return undefined;
        }
        else {
            return defaultValue;
        }
    }
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column) {
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }
    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column) {
        if (column.length)
            return column.length.toString();
        switch (column.type) {
            case String:
            case "varchar":
            case "varchar2":
            case "nvarchar2":
                return "255";
            case "raw":
                return "2000";
            case "uuid":
                return "36";
            default:
                return "";
        }
    }
    createFullType(column) {
        let type = column.type;
        // used 'getColumnLength()' method, because in Oracle column length is required for some data types.
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;
        }
        else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += "(" + column.precision + "," + column.scale + ")";
        }
        else if (column.precision !== null && column.precision !== undefined) {
            type += "(" + column.precision + ")";
        }
        if (column.type === "timestamp with time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";
        }
        else if (column.type === "timestamp with local time zone") {
            type = "TIMESTAMP" + (column.precision !== null && column.precision !== undefined ? "(" + column.precision + ")" : "") + " WITH LOCAL TIME ZONE";
        }
        if (column.isArray)
            type += " array";
        return type;
    }
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection() {
        return new Promise((ok, fail) => {
            this.master.getConnection((err, connection, release) => {
                if (err)
                    return fail(err);
                ok(connection);
            });
        });
    }
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection() {
        if (!this.slaves.length)
            return this.obtainMasterConnection();
        return new Promise((ok, fail) => {
            const random = Math.floor(Math.random() * this.slaves.length);
            this.slaves[random].getConnection((err, connection) => {
                if (err)
                    return fail(err);
                ok(connection);
            });
        });
    }
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata, insertResult) {
        if (!insertResult)
            return undefined;
        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils_1.OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column)));
            }
            return map;
        }, {});
    }
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns, columnMetadatas) {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed
            const isColumnChanged = tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                // || tableColumn.comment !== columnMetadata.comment
                || tableColumn.default !== this.normalizeDefault(columnMetadata)
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);
            // DEBUG SECTION
            // if (isColumnChanged) {
            //     console.log("table:", columnMetadata.entityMetadata.tableName);
            //     console.log("name:", tableColumn.name, columnMetadata.databaseName);
            //     console.log("type:", tableColumn.type, this.normalizeType(columnMetadata));
            //     console.log("length:", tableColumn.length, columnMetadata.length);
            //     console.log("precision:", tableColumn.precision, columnMetadata.precision);
            //     console.log("scale:", tableColumn.scale, columnMetadata.scale);
            //     console.log("comment:", tableColumn.comment, columnMetadata.comment);
            //     console.log("default:", tableColumn.default, this.normalizeDefault(columnMetadata));
            //     console.log("enum:", tableColumn.enum && columnMetadata.enum && !OrmUtils.isArraysEqual(tableColumn.enum, columnMetadata.enum.map(val => val + "")));
            //     console.log("onUpdate:", tableColumn.onUpdate, columnMetadata.onUpdate);
            //     console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            //     console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            //     console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            //     console.log("isGenerated:", tableColumn.isGenerated, columnMetadata.isGenerated);
            //     console.log("==========================================");
            // }
            return isColumnChanged;
        });
    }
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported() {
        return true;
    }
    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported() {
        return false;
    }
    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported() {
        return false;
    }
    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName, index) {
        return ":" + (index + 1);
    }
    /**
     * Converts column type in to native oracle type.
     */
    columnTypeToNativeParameter(type) {
        switch (this.normalizeType({ type: type })) {
            case "number":
            case "numeric":
            case "int":
            case "integer":
            case "smallint":
            case "dec":
            case "decimal":
                return this.oracle.NUMBER;
            case "char":
            case "nchar":
            case "nvarchar2":
            case "varchar2":
                return this.oracle.STRING;
            case "blob":
                return this.oracle.BLOB;
            case "clob":
                return this.oracle.CLOB;
            case "date":
            case "timestamp":
            case "timestamp with time zone":
            case "timestamp with local time zone":
                return this.oracle.DATE;
        }
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Loads all driver dependencies.
     */
    loadDependencies() {
        try {
            this.oracle = PlatformTools_1.PlatformTools.load("oracledb");
        }
        catch (e) {
            throw new DriverPackageNotInstalledError_1.DriverPackageNotInstalledError("Oracle", "oracledb");
        }
    }
    /**
     * Creates a new connection pool for a given database credentials.
     */
    createPool(options, credentials) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            credentials = Object.assign({}, credentials, DriverUtils_1.DriverUtils.buildDriverOptions(credentials)); // todo: do it better way
            // build connection options for the driver
            const connectionOptions = Object.assign({}, {
                user: credentials.username,
                password: credentials.password,
                connectString: credentials.connectString ? credentials.connectString : credentials.host + ":" + credentials.port + "/" + credentials.sid,
            }, options.extra || {});
            // pooling is enabled either when its set explicitly to true,
            // either when its not defined at all (e.g. enabled by default)
            return new Promise((ok, fail) => {
                this.oracle.createPool(connectionOptions, (err, pool) => {
                    if (err)
                        return fail(err);
                    ok(pool);
                });
            });
        });
    }
    /**
     * Closes connection pool.
     */
    closePool(pool) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((ok, fail) => {
                pool.close((err) => err ? fail(err) : ok());
                pool = undefined;
            });
        });
    }
}
exports.OracleDriver = OracleDriver;
//# sourceMappingURL=OracleDriver.js.map