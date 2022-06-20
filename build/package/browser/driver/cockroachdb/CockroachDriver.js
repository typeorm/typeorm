import { ConnectionIsNotSetError } from "../../error/ConnectionIsNotSetError";
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { DriverUtils } from "../DriverUtils";
import { DateUtils } from "../../util/DateUtils";
import { PlatformTools } from "../../platform/PlatformTools";
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder";
import { OrmUtils } from "../../util/OrmUtils";
import { CockroachQueryRunner } from "./CockroachQueryRunner";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";
import { TypeORMError } from "../../error";
import { ObjectUtils } from "../../util/ObjectUtils";
import { InstanceChecker } from "../../util/InstanceChecker";
/**
 * Organizes communication with Cockroach DBMS.
 */
export class CockroachDriver {
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
         * We store all created query runners because we need to release them.
         */
        this.connectedQueryRunners = [];
        /**
         * Indicates if replication is enabled.
         */
        this.isReplicated = false;
        /**
         * Indicates if tree tables are supported by this driver.
         */
        this.treeSupport = true;
        /**
         * Represent transaction support by this driver
         */
        this.transactionSupport = "nested";
        /**
         * Gets list of supported column data types by a driver.
         *
         * @see https://www.cockroachlabs.com/docs/stable/data-types.html
         */
        this.supportedDataTypes = [
            "array",
            "bool",
            "boolean",
            "bytes",
            "bytea",
            "blob",
            "date",
            "enum",
            "numeric",
            "decimal",
            "dec",
            "float",
            "float4",
            "float8",
            "double precision",
            "real",
            "inet",
            "int",
            "int4",
            "integer",
            "int2",
            "int8",
            "int64",
            "smallint",
            "bigint",
            "interval",
            "string",
            "character varying",
            "character",
            "char",
            "char varying",
            "varchar",
            "text",
            "time",
            "time without time zone",
            "timestamp",
            "timestamptz",
            "timestamp without time zone",
            "timestamp with time zone",
            "json",
            "jsonb",
            "uuid",
        ];
        /**
         * Returns type of upsert supported by driver if any
         */
        this.supportedUpsertType = "on-conflict-do-update";
        /**
         * Gets list of spatial column data types.
         */
        this.spatialTypes = [];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withLengthColumnTypes = [
            "character varying",
            "char varying",
            "varchar",
            "character",
            "char",
            "string",
        ];
        /**
         * Gets list of column data types that support precision by a driver.
         */
        this.withPrecisionColumnTypes = ["numeric", "decimal", "dec"];
        /**
         * Gets list of column data types that support scale by a driver.
         */
        this.withScaleColumnTypes = ["numeric", "decimal", "dec"];
        /**
         * Orm has special columns and we need to know what database column types should be for those types.
         * Column types are driver dependant.
         */
        this.mappedDataTypes = {
            createDate: "timestamptz",
            createDateDefault: "now()",
            updateDate: "timestamptz",
            updateDateDefault: "now()",
            deleteDate: "timestamptz",
            deleteDateNullable: true,
            version: Number,
            treeLevel: Number,
            migrationId: Number,
            migrationName: "varchar",
            migrationTimestamp: "int8",
            cacheId: Number,
            cacheIdentifier: "varchar",
            cacheTime: "int8",
            cacheDuration: Number,
            cacheQuery: "string",
            cacheResult: "string",
            metadataType: "varchar",
            metadataDatabase: "varchar",
            metadataSchema: "varchar",
            metadataTable: "varchar",
            metadataName: "varchar",
            metadataValue: "string",
        };
        /**
         * Default values of length, precision and scale depends on column data type.
         * Used in the cases when length/precision/scale is not specified by user.
         */
        this.dataTypeDefaults = {
            char: { length: 1 },
        };
        this.cteCapabilities = {
            enabled: true,
            writable: true,
            materializedHint: true,
            requiresRecursiveHint: true,
        };
        this.connection = connection;
        this.options = connection.options;
        this.isReplicated = this.options.replication ? true : false;
        // load postgres package
        this.loadDependencies();
        this.database = DriverUtils.buildDriverOptions(this.options.replication
            ? this.options.replication.master
            : this.options).database;
        this.schema = DriverUtils.buildDriverOptions(this.options).schema;
        // ObjectUtils.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // todo: revisit validation with replication in mind
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.database)
        //     throw new DriverOptionNotSetError("database");
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect() {
        if (this.options.replication) {
            this.slaves = await Promise.all(this.options.replication.slaves.map((slave) => {
                return this.createPool(this.options, slave);
            }));
            this.master = await this.createPool(this.options, this.options.replication.master);
        }
        else {
            this.master = await this.createPool(this.options, this.options);
        }
        if (!this.database || !this.searchSchema) {
            const queryRunner = await this.createQueryRunner("master");
            if (!this.database) {
                this.database = await queryRunner.getCurrentDatabase();
            }
            if (!this.searchSchema) {
                this.searchSchema = await queryRunner.getCurrentSchema();
            }
            await queryRunner.release();
        }
        if (!this.schema) {
            this.schema = this.searchSchema;
        }
    }
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect() {
        return Promise.resolve();
    }
    /**
     * Closes connection with database.
     */
    async disconnect() {
        if (!this.master)
            return Promise.reject(new ConnectionIsNotSetError("cockroachdb"));
        await this.closePool(this.master);
        await Promise.all(this.slaves.map((slave) => this.closePool(slave)));
        this.master = undefined;
        this.slaves = [];
    }
    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        return new CockroachQueryRunner(this, mode);
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        if (value === null || value === undefined)
            return value;
        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;
        }
        else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);
        }
        else if (columnMetadata.type === "datetime" ||
            columnMetadata.type === Date ||
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === "timestamp with time zone" ||
            columnMetadata.type === "timestamp without time zone") {
            return DateUtils.mixedDateToDate(value);
        }
        else if (["json", "jsonb", ...this.spatialTypes].indexOf(columnMetadata.type) >= 0) {
            return JSON.stringify(value);
        }
        else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);
        }
        else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value);
        }
        return value;
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value, columnMetadata) {
        if (value === null || value === undefined)
            return columnMetadata.transformer
                ? ApplyValueTransformers.transformFrom(columnMetadata.transformer, value)
                : value;
        // unique_rowid() generates bigint value and should not be converted to number
        if (([Number, "int4", "smallint", "int2"].some((v) => v === columnMetadata.type) &&
            !columnMetadata.isArray) ||
            columnMetadata.generationStrategy === "increment") {
            value = parseInt(value);
        }
        else if (columnMetadata.type === Boolean) {
            value = value ? true : false;
        }
        else if (columnMetadata.type === "datetime" ||
            columnMetadata.type === Date ||
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === "timestamp with time zone" ||
            columnMetadata.type === "timestamp without time zone") {
            value = DateUtils.normalizeHydratedDate(value);
        }
        else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value);
        }
        else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value);
        }
        else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value);
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql, parameters, nativeParameters) {
        const escapedParameters = Object.keys(nativeParameters).map((key) => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];
        sql = sql.replace(/:(\.\.\.)?([A-Za-z0-9_.]+)/g, (full, isArray, key) => {
            if (!parameters.hasOwnProperty(key)) {
                return full;
            }
            let value = parameters[key];
            if (isArray) {
                return value
                    .map((v) => {
                    escapedParameters.push(v);
                    return this.createParameter(key, escapedParameters.length - 1);
                })
                    .join(", ");
            }
            if (typeof value === "function") {
                return value();
            }
            escapedParameters.push(value);
            return this.createParameter(key, escapedParameters.length - 1);
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }
    /**
     * Escapes a column name.
     */
    escape(columnName) {
        return '"' + columnName + '"';
    }
    /**
     * Build full table name with schema name and table name.
     * E.g. myDB.mySchema.myTable
     */
    buildTableName(tableName, schema) {
        let tablePath = [tableName];
        if (schema) {
            tablePath.unshift(schema);
        }
        return tablePath.join(".");
    }
    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(target) {
        const driverDatabase = this.database;
        const driverSchema = this.schema;
        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            // name is sometimes a path
            const parsed = this.parseTableName(target.name);
            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            };
        }
        if (InstanceChecker.isTableForeignKey(target)) {
            // referencedTableName is sometimes a path
            const parsed = this.parseTableName(target.referencedTableName);
            return {
                database: target.referencedDatabase ||
                    parsed.database ||
                    driverDatabase,
                schema: target.referencedSchema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            };
        }
        if (InstanceChecker.isEntityMetadata(target)) {
            // EntityMetadata tableName is never a path
            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            };
        }
        const parts = target.split(".");
        return {
            database: driverDatabase,
            schema: (parts.length > 1 ? parts[0] : undefined) || driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        };
    }
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column) {
        if (column.type === Number ||
            column.type === "integer" ||
            column.type === "int" ||
            column.type === "bigint" ||
            column.type === "int64") {
            return "int8";
        }
        else if (column.type === String ||
            column.type === "character varying" ||
            column.type === "char varying") {
            return "varchar";
        }
        else if (column.type === Date ||
            column.type === "timestamp without time zone") {
            return "timestamp";
        }
        else if (column.type === "timestamp with time zone") {
            return "timestamptz";
        }
        else if (column.type === "time without time zone") {
            return "time";
        }
        else if (column.type === Boolean || column.type === "boolean") {
            return "bool";
        }
        else if (column.type === "simple-array" ||
            column.type === "simple-json" ||
            column.type === "text") {
            return "string";
        }
        else if (column.type === "bytea" || column.type === "blob") {
            return "bytes";
        }
        else if (column.type === "smallint") {
            return "int2";
        }
        else if (column.type === "numeric" || column.type === "dec") {
            return "decimal";
        }
        else if (column.type === "double precision" ||
            column.type === "float") {
            return "float8";
        }
        else if (column.type === "real") {
            return "float4";
        }
        else if (column.type === "character") {
            return "char";
        }
        else if (column.type === "json") {
            return "jsonb";
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
        const arrayCast = columnMetadata.isArray
            ? `::${columnMetadata.type}[]`
            : "";
        if (typeof defaultValue === "number") {
            return `(${defaultValue})`;
        }
        if (typeof defaultValue === "boolean") {
            return defaultValue ? "true" : "false";
        }
        if (typeof defaultValue === "function") {
            const value = defaultValue();
            if (value.toUpperCase() === "CURRENT_TIMESTAMP") {
                return "current_timestamp()";
            }
            else if (value.toUpperCase() === "CURRENT_DATE") {
                return "current_date()";
            }
            return value;
        }
        if (typeof defaultValue === "string") {
            return `'${defaultValue}'${arrayCast}`;
        }
        if (ObjectUtils.isObject(defaultValue) && defaultValue !== null) {
            return `'${JSON.stringify(defaultValue)}'`;
        }
        if (defaultValue === undefined || defaultValue === null) {
            return undefined;
        }
        return `${defaultValue}`;
    }
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column) {
        return column.entityMetadata.uniques.some((uq) => uq.columns.length === 1 && uq.columns[0] === column);
    }
    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column) {
        return column.length ? column.length.toString() : "";
    }
    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column) {
        let type = column.type;
        if (column.length) {
            type += "(" + column.length + ")";
        }
        else if (column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined) {
            type += "(" + column.precision + "," + column.scale + ")";
        }
        else if (column.precision !== null &&
            column.precision !== undefined) {
            type += "(" + column.precision + ")";
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
    async obtainMasterConnection() {
        if (!this.master) {
            throw new TypeORMError("Driver not Connected");
        }
        return new Promise((ok, fail) => {
            this.master.connect((err, connection, release) => {
                err ? fail(err) : ok([connection, release]);
            });
        });
    }
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    async obtainSlaveConnection() {
        if (!this.slaves.length)
            return this.obtainMasterConnection();
        const random = Math.floor(Math.random() * this.slaves.length);
        return new Promise((ok, fail) => {
            this.slaves[random].connect((err, connection, release) => {
                err ? fail(err) : ok([connection, release]);
            });
        });
    }
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     *
     * todo: slow. optimize Object.keys(), OrmUtils.mergeDeep and column.createValueMap parts
     */
    createGeneratedMap(metadata, insertResult) {
        if (!insertResult)
            return undefined;
        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column)));
            }
            return map;
        }, {});
    }
    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns, columnMetadatas) {
        return columnMetadatas.filter((columnMetadata) => {
            const tableColumn = tableColumns.find((c) => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed
            // console.log("table:", columnMetadata.entityMetadata.tableName);
            // console.log("name:", tableColumn.name, columnMetadata.databaseName);
            // console.log("type:", tableColumn.type, this.normalizeType(columnMetadata));
            // console.log("length:", tableColumn.length, columnMetadata.length);
            // console.log("width:", tableColumn.width, columnMetadata.width);
            // console.log("precision:", tableColumn.precision, columnMetadata.precision);
            // console.log("scale:", tableColumn.scale, columnMetadata.scale);
            // console.log("comment:", tableColumn.comment, this.escapeComment(columnMetadata.comment));
            // console.log("default:", tableColumn.default, columnMetadata.default);
            // console.log("default changed:", !this.compareDefaultValues(this.normalizeDefault(columnMetadata), tableColumn.default));
            // console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            // console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            // console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            // console.log("isGenerated:", tableColumn.isGenerated, columnMetadata.isGenerated);
            // console.log("==========================================");
            return (tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== columnMetadata.length ||
                tableColumn.precision !== columnMetadata.precision ||
                (columnMetadata.scale !== undefined &&
                    tableColumn.scale !== columnMetadata.scale) ||
                tableColumn.comment !==
                    this.escapeComment(columnMetadata.comment) ||
                (!tableColumn.isGenerated &&
                    this.lowerDefaultValueIfNecessary(this.normalizeDefault(columnMetadata)) !== tableColumn.default) || // we included check for generated here, because generated columns already can have default values
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                tableColumn.isNullable !== columnMetadata.isNullable ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                tableColumn.isGenerated !== columnMetadata.isGenerated ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                (tableColumn.asExpression || "").trim() !==
                    (columnMetadata.asExpression || "").trim());
        });
    }
    lowerDefaultValueIfNecessary(value) {
        if (!value) {
            return value;
        }
        return value
            .split(`'`)
            .map((v, i) => {
            return i % 2 === 1 ? v : v.toLowerCase();
        })
            .join(`'`);
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
        return true;
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
        return "$" + (index + 1);
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads postgres query stream package.
     */
    loadStreamDependency() {
        try {
            return PlatformTools.load("pg-query-stream");
        }
        catch (e) {
            // todo: better error for browser env
            throw new TypeORMError(`To use streams you should install pg-query-stream package. Please run npm i pg-query-stream --save command.`);
        }
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    loadDependencies() {
        try {
            const postgres = this.options.driver || PlatformTools.load("pg");
            this.postgres = postgres;
            try {
                const pgNative = this.options.nativeDriver || PlatformTools.load("pg-native");
                if (pgNative && this.postgres.native)
                    this.postgres = this.postgres.native;
            }
            catch (e) { }
        }
        catch (e) {
            // todo: better error for browser env
            throw new DriverPackageNotInstalledError("Postgres", "pg");
        }
    }
    /**
     * Creates a new connection pool for a given database credentials.
     */
    async createPool(options, credentials) {
        credentials = Object.assign({}, credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way
        // build connection options for the driver
        const connectionOptions = Object.assign({}, {
            host: credentials.host,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            port: credentials.port,
            ssl: credentials.ssl,
            application_name: options.applicationName,
        }, options.extra || {});
        // create a connection pool
        const pool = new this.postgres.Pool(connectionOptions);
        const { logger } = this.connection;
        const poolErrorHandler = options.poolErrorHandler ||
            ((error) => logger.log("warn", `Postgres pool raised an error. ${error}`));
        /*
          Attaching an error handler to pool errors is essential, as, otherwise, errors raised will go unhandled and
          cause the hosting app to crash.
         */
        pool.on("error", poolErrorHandler);
        return new Promise((ok, fail) => {
            pool.connect((err, connection, release) => {
                if (err)
                    return fail(err);
                release();
                ok(pool);
            });
        });
    }
    /**
     * Closes connection pool.
     */
    async closePool(pool) {
        await Promise.all(this.connectedQueryRunners.map((queryRunner) => queryRunner.release()));
        return new Promise((ok, fail) => {
            pool.end((err) => (err ? fail(err) : ok()));
        });
    }
    /**
     * Escapes a given comment.
     */
    escapeComment(comment) {
        if (!comment)
            return comment;
        comment = comment.replace(/'/g, "''").replace(/\u0000/g, ""); // Null bytes aren't allowed in comments
        return comment;
    }
}

//# sourceMappingURL=CockroachDriver.js.map
