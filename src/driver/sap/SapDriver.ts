import {Driver} from "../Driver";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {SapQueryRunner} from "./SapQueryRunner";
import {ObjectLiteral} from "../..";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../..";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {SapConnectionOptions} from "./SapConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../..";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../..";
import {EntityMetadata} from "../..";
import {OrmUtils} from "../../util/OrmUtils";
import {ApplyValueTransformers} from "../../util/ApplyValueTransformers";

/**
 * Organizes communication with SAP Hana DBMS.
 *
 * todo: looks like there is no built in support for connection pooling, we need to figure out something
 */
export class SapDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: Connection;

    /**
     * Hana client instance.
     */
    client: any;

    /**
     * Master connection.
     */
    master: any;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: SapConnectionOptions;

    /**
     * Master database used to perform all write queries.
     */
    database?: string;

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false;

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true;

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://help.sap.com/viewer/4fe29514fd584807ac9f2a04f6754767/2.0.03/en-US/20a1569875191014b507cf392724b7eb.html
     */
    supportedDataTypes: ColumnType[] = [
        "tinyint",
        "smallint",
        "int",
        "integer",
        "bigint",
        "smalldecimal",
        "decimal",
        "dec",
        "real",
        "double",
        "float",
        "date",
        "time",
        "seconddate",
        "timestamp",
        "boolean",
        "char",
        "nchar",
        "varchar",
        "nvarchar",
        "text",
        "alphanum",
        "shorttext",
        "array",
        "varbinary",
        "blob",
        "clob",
        "nclob",
        "st_geometry",
        "st_point",
    ];

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = [
        "st_geometry",
        "st_point",
    ];

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "varchar",
        "nvarchar",
        "alphanum",
        "shorttext",
        "varbinary"
    ];

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
    ];

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = [
        "decimal",
    ];

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "timestamp",
        updateDateDefault: "CURRENT_TIMESTAMP",
        version: "integer",
        treeLevel: "integer",
        migrationId: "integer",
        migrationName: "nvarchar",
        migrationTimestamp: "bigint",
        cacheId: "integer",
        cacheIdentifier: "nvarchar",
        cacheTime: "bigint",
        cacheDuration: "integer",
        cacheQuery: "nvarchar",
        cacheResult: "nvarchar",
        metadataType: "nvarchar",
        metadataDatabase: "nvarchar",
        metadataSchema: "nvarchar",
        metadataTable: "nvarchar",
        metadataName: "nvarchar",
        metadataValue: "nvarchar",
    };

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {
        "char": { length: 1 },
        "nchar": { length: 1 },
        "varchar": { length: 255 },
        "nvarchar": { length: 255 },
        "shorttext": { length: 255 },
        "varbinary": { length: 255 },
        "decimal": { precision: 18, scale: 0 },
    };

    /**
     * Max length allowed by SAP HANA for aliases (identifiers).
     * @see https://help.sap.com/viewer/4fe29514fd584807ac9f2a04f6754767/2.0.03/en-US/20a760537519101497e3cfe07b348f3c.html
     */
    maxAliasLength = 128;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as SapConnectionOptions;
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect(): Promise<void> {
        this.master = await this.createConnection(this.options);
        this.database = this.options.database;
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        await this.closeConnection();
        this.master = undefined;
    }


    /**
     * Closes connection pool.
     */
    protected async closeConnection(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (!this.master) return ok();
            this.master.disconnect((err: any) => err ? fail(err) : ok());
        });
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
    createQueryRunner(mode: "master"|"slave" = "master") {
        return new SapQueryRunner(this, mode);
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];

        const keys = Object.keys(parameters).map(parameter => "(:(\\.\\.\\.)?" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            let value: any;
            let isArray = false;
            if (key.substr(0, 4) === ":...") {
                isArray = true;
                value = parameters[key.substr(4)];
            } else {
                value = parameters[key.substr(1)];
            }

            if (isArray) {
                return value.map((v: any) => {
                    escapedParameters.push(v);
                    return "?"; // "@" + (escapedParameters.length - 1);
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else {
                escapedParameters.push(value);
                return "?"; // "@" + (escapedParameters.length - 1);
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return `"${columnName}"`;
    }

    /**
     * Build full table name with schema name and table name.
     * E.g. "mySchema"."myTable"
     */
    buildTableName(tableName: string, schema?: string): string {
        return schema ? `${schema}.${tableName}` : tableName;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "timestamp"
            || columnMetadata.type === Date) {
            return DateUtils.mixedDateToDatetimeString(value, true);

        } else if (columnMetadata.type === "seconddate") {
            return DateUtils.mixedDateToDatetimeString(value, false);

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);

        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value);

        } else if (columnMetadata.type === "simple-enum") {
            return DateUtils.simpleEnumToString(value);

        } else if (columnMetadata.isArray) {
            return () => `ARRAY(${value.map((it: any) => `'${it}'`)})`;
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return columnMetadata.transformer ? ApplyValueTransformers.transformFrom(columnMetadata.transformer, value) : value;

        if (columnMetadata.type === Boolean) {
            value = value ? true : false;

        } else if (columnMetadata.type === "timestamp"
            || columnMetadata.type === "seconddate"
            || columnMetadata.type === Date) {
            value = DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value);

        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value);

        } else if (columnMetadata.type === "simple-enum") {
            value = DateUtils.stringToSimpleEnum(value, columnMetadata);
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);

        return value;
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number|null, scale?: number }): string {
        if (column.type === Number || column.type === "integer") {
            return "integer";

        } else if (column.type === String) {
            return "nvarchar";

        } else if (column.type === Date) {
            return "timestamp";

        } else if (column.type === Boolean) {
            return "boolean";

        } else if ((column.type as any) === Buffer) {
            return "blob";

        } else if (column.type === "uuid") {
            return "varbinary";

        } else if (column.type === "simple-array" || column.type === "simple-json") {
            return "text";

        } else if (column.type === "simple-enum") {
            return "nvarchar";

        } else {
            return column.type as string || "";
        }
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string {
        const defaultValue = columnMetadata.default;

        if (typeof defaultValue === "number") {
            return "" + defaultValue;

        } else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "1" : "0";

        } else if (typeof defaultValue === "function") {
            return /*"(" + */defaultValue()/* + ")"*/;

        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;

        } else {
            return defaultValue;
        }
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.uniques.some(uq => uq.columns.length === 1 && uq.columns[0] === column);
    }

    /**
     * Returns default column lengths, which is required on column creation.
     */
    getColumnLength(column: ColumnMetadata|TableColumn): string {
        if (column.length)
            return column.length.toString();

        if (column.generationStrategy === "uuid")
            return "16";

        switch (column.type) {
            case "varchar":
            case "nvarchar":
            case "shorttext":
            case String:
                return "255";
            case "alphanum":
                return "127";
            case "varbinary":
                return "255";
        }

        return "";
    }

    /**
     * Creates column type definition including length, precision and scale
     */
    createFullType(column: TableColumn): string {
        let type = column.type;

        // used 'getColumnLength()' method, because SqlServer sets `varchar` and `nvarchar` length to 1 by default.
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += `(${column.precision},${column.scale})`;

        } else if (column.precision !== null && column.precision !== undefined) {
            type +=  `(${column.precision})`;
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
    obtainMasterConnection(): Promise<any> {
        return Promise.resolve(this.master);
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return Promise.resolve(this.master);
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        if (!insertResult)
            return undefined;

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column)));
            }
            return map;
        }, {} as ObjectLiteral);
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed

            // console.log("table:", columnMetadata.entityMetadata.tableName);
            // console.log("name:", tableColumn.name, columnMetadata.databaseName);
            // console.log("type:", tableColumn.type, this.normalizeType(columnMetadata));
            // console.log("length:", tableColumn.length, columnMetadata.length);
            // console.log("width:", tableColumn.width, columnMetadata.width);
            // console.log("precision:", tableColumn.precision, columnMetadata.precision);
            // console.log("scale:", tableColumn.scale, columnMetadata.scale);
            // console.log("default:", tableColumn.default, columnMetadata.default);
            // console.log("isPrimary:", tableColumn.isPrimary, columnMetadata.isPrimary);
            // console.log("isNullable:", tableColumn.isNullable, columnMetadata.isNullable);
            // console.log("isUnique:", tableColumn.isUnique, this.normalizeIsUnique(columnMetadata));
            // console.log("isGenerated:", tableColumn.isGenerated, columnMetadata.isGenerated);
            // console.log((columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated));
            // console.log("==========================================");

            return  tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                // || tableColumn.comment !== columnMetadata.comment || // todo
                || (!tableColumn.isGenerated && this.lowerDefaultValueIfNessesary(this.normalizeDefault(columnMetadata)) !== this.lowerDefaultValueIfNessesary(tableColumn.default)) // we included check for generated here, because generated columns already can have default values
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || tableColumn.isGenerated !== columnMetadata.isGenerated;
        });
    }

    private lowerDefaultValueIfNessesary(value: string | undefined) {
        // SqlServer saves function calls in default value as lowercase #2733
        if (!value) {
            return value;
        }
        return value.split(`'`).map((v, i) => {
            return i % 2 === 1 ? v : v.toLowerCase();
        }).join(`'`);
    }
    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return true;
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return true;
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return "?";
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.client = PlatformTools.load("@sap/hana-client");

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("SAP Hana", "hdb");
        }
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected createConnection(options: SapConnectionOptions): Promise<any> {

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        return new Promise<any>((ok, fail) => {
            try {
                const master = new this.client.createConnection();
                master.connect({
                    host: options.host,
                    port: options.port,
                    uid: options.username,
                    pwd: options.password,
                    databaseName: options.database,
                    ...options.extra
                }, (err: any) => {
                    if (err) {
                        fail(err);
                        return;
                    }
                    ok(master);
                });

            } catch (err) {
                fail(err);
            }
        });
    }

}
