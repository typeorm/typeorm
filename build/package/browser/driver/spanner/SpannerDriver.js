import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError";
import { SpannerQueryRunner } from "./SpannerQueryRunner";
import { DateUtils } from "../../util/DateUtils";
import { PlatformTools } from "../../platform/PlatformTools";
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder";
import { EntityMetadata } from "../../metadata/EntityMetadata";
import { OrmUtils } from "../../util/OrmUtils";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";
import { Table } from "../../schema-builder/table/Table";
import { View } from "../../schema-builder/view/View";
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey";
/**
 * Organizes communication with Spanner DBMS.
 */
export class SpannerDriver {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
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
        this.transactionSupport = "none";
        /**
         * Gets list of supported column data types by a driver.
         *
         * @see https://cloud.google.com/spanner/docs/reference/standard-sql/data-types
         */
        this.supportedDataTypes = [
            "bool",
            "int64",
            "float64",
            "numeric",
            "string",
            "json",
            "bytes",
            "date",
            "timestamp",
            "array",
        ];
        /**
         * Returns type of upsert supported by driver if any
         */
        this.supportedUpsertType = undefined;
        /**
         * Gets list of spatial column data types.
         */
        this.spatialTypes = [];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withLengthColumnTypes = ["string", "bytes"];
        /**
         * Gets list of column data types that support length by a driver.
         */
        this.withWidthColumnTypes = [];
        /**
         * Gets list of column data types that support precision by a driver.
         */
        this.withPrecisionColumnTypes = [];
        /**
         * Gets list of column data types that supports scale by a driver.
         */
        this.withScaleColumnTypes = [];
        /**
         * ORM has special columns and we need to know what database column types should be for those columns.
         * Column types are driver dependant.
         */
        this.mappedDataTypes = {
            createDate: "timestamp",
            createDateDefault: "",
            updateDate: "timestamp",
            updateDateDefault: "",
            deleteDate: "timestamp",
            deleteDateNullable: true,
            version: "int64",
            treeLevel: "int64",
            migrationId: "int64",
            migrationName: "string",
            migrationTimestamp: "int64",
            cacheId: "string",
            cacheIdentifier: "string",
            cacheTime: "int64",
            cacheDuration: "int64",
            cacheQuery: "string",
            cacheResult: "string",
            metadataType: "string",
            metadataDatabase: "string",
            metadataSchema: "string",
            metadataTable: "string",
            metadataName: "string",
            metadataValue: "string",
        };
        /**
         * Default values of length, precision and scale depends on column data type.
         * Used in the cases when length/precision/scale is not specified by user.
         */
        this.dataTypeDefaults = {};
        /**
         * Max length allowed by MySQL for aliases.
         * @see https://dev.mysql.com/doc/refman/5.5/en/identifiers.html
         */
        this.maxAliasLength = 63;
        this.cteCapabilities = {
            enabled: true,
        };
        /**
         * Supported returning types
         */
        this._isReturningSqlSupported = {
            delete: false,
            insert: false,
            update: false,
        };
        this.connection = connection;
        this.options = connection.options;
        this.isReplicated = this.options.replication ? true : false;
        // load mysql package
        this.loadDependencies();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     */
    async connect() {
        this.instance = this.spanner.instance(this.options.instanceId);
        this.instanceDatabase = this.instance.database(this.options.databaseId);
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
    async disconnect() {
        this.instanceDatabase.close();
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
        return new SpannerQueryRunner(this, mode);
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
            if (value === null) {
                return full;
            }
            if (isArray) {
                return value
                    .map((v) => {
                    escapedParameters.push(v);
                    return this.createParameter(key, escapedParameters.length - 1);
                })
                    .join(", ");
            }
            if (value instanceof Function) {
                return value();
            }
            escapedParameters.push(value);
            return this.createParameter(key, escapedParameters.length - 1);
        }); // todo: make replace only in value statements, otherwise problems
        sql = sql.replace(/([ ]+)?=([ ]+)?:(\.\.\.)?([A-Za-z0-9_.]+)/g, (full, emptySpaceBefore, emptySpaceAfter, isArray, key) => {
            if (!parameters.hasOwnProperty(key)) {
                return full;
            }
            let value = parameters[key];
            if (value === null) {
                return " IS NULL";
            }
            return full;
        });
        return [sql, escapedParameters];
    }
    /**
     * Escapes a column name.
     */
    escape(columnName) {
        return `\`${columnName}\``;
    }
    /**
     * Build full table name with database name, schema name and table name.
     * E.g. myDB.mySchema.myTable
     */
    buildTableName(tableName, schema, database) {
        let tablePath = [tableName];
        if (database) {
            tablePath.unshift(database);
        }
        return tablePath.join(".");
    }
    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(target) {
        const driverDatabase = this.database;
        const driverSchema = undefined;
        if (target instanceof Table || target instanceof View) {
            const parsed = this.parseTableName(target.name);
            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            };
        }
        if (target instanceof TableForeignKey) {
            const parsed = this.parseTableName(target.referencedTableName);
            return {
                database: target.referencedDatabase ||
                    parsed.database ||
                    driverDatabase,
                schema: target.referencedSchema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            };
        }
        if (target instanceof EntityMetadata) {
            // EntityMetadata tableName is never a path
            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            };
        }
        const parts = target.split(".");
        return {
            database: (parts.length > 1 ? parts[0] : undefined) || driverDatabase,
            schema: driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        };
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        if (value === null || value === undefined)
            return value;
        if (columnMetadata.type === "numeric") {
            const lib = this.options.driver || PlatformTools.load("spanner");
            return lib.Spanner.numeric(value);
        }
        else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "json") {
            return value;
        }
        else if (columnMetadata.type === "timestamp" ||
            columnMetadata.type === Date) {
            return DateUtils.mixedDateToDate(value);
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
        if (columnMetadata.type === Boolean || columnMetadata.type === "bool") {
            value = value ? true : false;
        }
        else if (columnMetadata.type === "timestamp" ||
            columnMetadata.type === Date) {
            value = new Date(value);
        }
        else if (columnMetadata.type === "numeric") {
            value = value.value;
        }
        else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);
        }
        else if (columnMetadata.type === "json") {
            value = typeof value === "string" ? JSON.parse(value) : value;
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return value;
    }
    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column) {
        if (column.type === Number) {
            return "int64";
        }
        else if (column.type === String || column.type === "uuid") {
            return "string";
        }
        else if (column.type === Date) {
            return "timestamp";
        }
        else if (column.type === Buffer) {
            return "bytes";
        }
        else if (column.type === Boolean) {
            return "bool";
        }
        else {
            return column.type || "";
        }
    }
    /**
     * Normalizes "default" value of the column.
     *
     * Spanner does not support default values.
     */
    normalizeDefault(columnMetadata) {
        return columnMetadata.default === ""
            ? `"${columnMetadata.default}"`
            : `${columnMetadata.default}`;
    }
    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column) {
        return column.entityMetadata.indices.some((idx) => idx.isUnique &&
            idx.columns.length === 1 &&
            idx.columns[0] === column);
    }
    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column) {
        if (column.length)
            return column.length.toString();
        if (column.generationStrategy === "uuid")
            return "36";
        switch (column.type) {
            case String:
            case "string":
            case "bytes":
                return "max";
            default:
                return "";
        }
    }
    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column) {
        let type = column.type;
        // used 'getColumnLength()' method, because Spanner requires column length for `string` and `bytes` data types
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;
        }
        else if (column.width) {
            type += `(${column.width})`;
        }
        else if (column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined) {
            type += `(${column.precision},${column.scale})`;
        }
        else if (column.precision !== null &&
            column.precision !== undefined) {
            type += `(${column.precision})`;
        }
        if (column.isArray)
            type = `array<${type}>`;
        return type;
    }
    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection() {
        return this.instanceDatabase;
    }
    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection() {
        return this.instanceDatabase;
    }
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata, insertResult, entityIndex) {
        if (!insertResult) {
            return undefined;
        }
        if (insertResult.insertId === undefined) {
            return Object.keys(insertResult).reduce((map, key) => {
                const column = metadata.findColumnWithDatabaseName(key);
                if (column) {
                    OrmUtils.mergeDeep(map, column.createValueMap(insertResult[key]));
                    // OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column))); // TODO: probably should be like there, but fails on enums, fix later
                }
                return map;
            }, {});
        }
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            let value;
            if (generatedColumn.generationStrategy === "increment" &&
                insertResult.insertId) {
                // NOTE: When multiple rows is inserted by a single INSERT statement,
                // `insertId` is the value generated for the first inserted row only.
                value = insertResult.insertId + entityIndex;
                // } else if (generatedColumn.generationStrategy === "uuid") {
                //     console.log("getting db value:", generatedColumn.databaseName);
                //     value = generatedColumn.getEntityValue(uuidMap);
            }
            return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
        }, {});
        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
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
            const isColumnChanged = tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== this.getColumnLength(columnMetadata) ||
                tableColumn.asExpression !== columnMetadata.asExpression ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                !this.compareNullableValues(columnMetadata, tableColumn) ||
                tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata);
            // DEBUG SECTION
            // if (isColumnChanged) {
            //     console.log("table:", columnMetadata.entityMetadata.tableName)
            //     console.log(
            //         "name:",
            //         tableColumn.name,
            //         columnMetadata.databaseName,
            //     )
            //     console.log(
            //         "type:",
            //         tableColumn.type,
            //         this.normalizeType(columnMetadata),
            //     )
            //     console.log(
            //         "length:",
            //         tableColumn.length,
            //         this.getColumnLength(columnMetadata),
            //     )
            //     console.log(
            //         "asExpression:",
            //         tableColumn.asExpression,
            //         columnMetadata.asExpression,
            //     )
            //     console.log(
            //         "generatedType:",
            //         tableColumn.generatedType,
            //         columnMetadata.generatedType,
            //     )
            //     console.log(
            //         "isPrimary:",
            //         tableColumn.isPrimary,
            //         columnMetadata.isPrimary,
            //     )
            //     console.log(
            //         "isNullable:",
            //         tableColumn.isNullable,
            //         columnMetadata.isNullable,
            //     )
            //     console.log(
            //         "isUnique:",
            //         tableColumn.isUnique,
            //         this.normalizeIsUnique(columnMetadata),
            //     )
            //     console.log("==========================================")
            // }
            return isColumnChanged;
        });
    }
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(returningType) {
        return this._isReturningSqlSupported[returningType];
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
        return "@param" + index;
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Loads all driver dependencies.
     */
    loadDependencies() {
        try {
            const lib = this.options.driver || PlatformTools.load("spanner");
            this.spanner = new lib.Spanner({
                projectId: this.options.projectId,
            });
        }
        catch (e) {
            console.error(e);
            throw new DriverPackageNotInstalledError("Spanner", "@google-cloud/spanner");
        }
    }
    compareNullableValues(columnMetadata, tableColumn) {
        // Spanner does not support NULL/NOT NULL expressions for generated columns
        if (columnMetadata.generatedType) {
            return true;
        }
        return columnMetadata.isNullable === tableColumn.isNullable;
    }
    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    compareDefaultValues(columnMetadataValue, databaseValue) {
        if (typeof columnMetadataValue === "string" &&
            typeof databaseValue === "string") {
            // we need to cut out "'" because in mysql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "");
            databaseValue = databaseValue.replace(/^'+|'+$/g, "");
        }
        return columnMetadataValue === databaseValue;
    }
    /**
     * If parameter is a datetime function, e.g. "CURRENT_TIMESTAMP", normalizes it.
     * Otherwise returns original input.
     */
    normalizeDatetimeFunction(value) {
        if (!value)
            return value;
        // check if input is datetime function
        const isDatetimeFunction = value.toUpperCase().indexOf("CURRENT_TIMESTAMP") !== -1 ||
            value.toUpperCase().indexOf("NOW") !== -1;
        if (isDatetimeFunction) {
            // extract precision, e.g. "(3)"
            const precision = value.match(/\(\d+\)/);
            return precision
                ? `CURRENT_TIMESTAMP${precision[0]}`
                : "CURRENT_TIMESTAMP";
        }
        else {
            return value;
        }
    }
    /**
     * Escapes a given comment.
     */
    escapeComment(comment) {
        if (!comment)
            return comment;
        comment = comment.replace(/\u0000/g, ""); // Null bytes aren't allowed in comments
        return comment;
    }
}

//# sourceMappingURL=SpannerDriver.js.map
