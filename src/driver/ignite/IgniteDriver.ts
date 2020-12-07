import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Connection} from "../../connection/Connection";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {ApplyValueTransformers} from "../../util/ApplyValueTransformers";
import {DateUtils} from "../../util/DateUtils";
import {OrmUtils} from "../../util/OrmUtils";
import {Driver} from "../Driver";
import {ColumnType} from "../types/ColumnTypes";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ReplicationMode} from "../types/ReplicationMode";
import {IgniteConnectionOptions} from "./IgniteConnectionOptions";
import {IgniteQueryRunner} from "./IgniteQueryRunner";

export class IgniteDriver implements Driver {
    isReplicated = false;

    treeSupport = true;

    /**
     * @see {@link https://ignite.apache.org/docs/latest/sql-reference/data-types}
     */
    supportedDataTypes: ColumnType[] = [
        "boolean",
        "bigint",
        "decimal",
        "double",
        "int",
        "real",
        "smallint",
        "tinyint",
        "char",
        "varchar",
        "date",
        "time",
        "timestamp",
        "binary",
        "geometry",
        "uuid",
    ];

    withLengthColumnTypes: ColumnType[] = ["char", "varchar", "binary", "geometry"];

    withPrecisionColumnTypes: ColumnType[] = ["real", "double", "decimal", "date", "time"];

    withWidthColumnTypes: ColumnType[] = ["tinyint", "smallint", "int", "bigint"];

    withScaleColumnTypes: ColumnType[] = ["decimal", "double", "real"];
    dataTypeDefaults: DataTypeDefaults;

    spatialTypes: ColumnType[] = ["geometry"];

    unsignedAndZerofillTypes: ColumnType[] = ["int", "smallint", "bigint", "tinyint", "real", "double", "decimal"];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "CURRENT_TIMESTAMP()",
        updateDate: "timestamp",
        updateDateDefault: "CURRENT_TIMESTAMP()",
        deleteDate: "int",
        deleteDateNullable: true,
        version: "int",
        treeLevel: "int",
        migrationId: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "int",
        cacheQuery: "varchar",
        cacheResult: "varchar",
        metadataType: "varchar",
        metadataDatabase: "varchar",
        metadataSchema: "varchar",
        metadataTable: "varchar",
        metadataName: "varchar",
        metadataValue: "varchar",
    };

    protected static mappedIgniteTypes: Record<string, string> = {
        "java.lang.Boolean": "bool",
        "java.lang.String": "varchar",
        "java.lang.Long": "bigint",
        "java.math.BigDecimal": "decimal",
        "java.lang.Double": "double",
        "java.lang.Integer": "int",
        "java.lang.Float": "real",
        "java.lang.Short": "smallint",
        "java.lang.Byte": "tinyint",
        "java.sql.Date": "date",
        "java.sql.Time": "time",
        "java.sql.Timestamp": "timestamp",
        "byte[]": "binary",
        "java.util.UUID": "uuid",
    };

    getSqlType(javaType: string): string {
        return IgniteDriver.mappedIgniteTypes[javaType];
    }

    connection: Connection;

    options: IgniteConnectionOptions;

    /**
     * ignite client library
     */
    IgniteClient: any;
    SqlFieldsQuery: any;

    /**
     * instance of ignite client
     */
    client: any;

    cache: any;

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return false;
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return false;
    }

    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported(): boolean {
        return true;
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return "?";
    }

    async onStateChanged(state: any, reason: any) {
        if (state === this.IgniteClient.STATE.CONNECTED) {
            console.log("ignite connected");
        } else if (state === this.IgniteClient.STATE.DISCONNECTED) {
            console.log("ignite disconnected");
            const autoReconnect = this.options.autoReconnect || true;

            if (autoReconnect) {
                console.log("reconnecting");
                await this.connect().catch(error => this.connection.logger.log("warn", "reconnection error" + error.message));
            }

            if (reason) {
                this.connection.logger.log("warn", reason);
            }
        }
    }

    constructor(connection: Connection) {
        this.loadDependencies();

        this.connection = connection;
        this.options = (connection.options as any) as IgniteConnectionOptions;

        this.SqlFieldsQuery = this.IgniteClient.SqlFieldsQuery;
    }

    async connect(): Promise<void> {
        this.client = new this.IgniteClient(this.onStateChanged.bind(this));
        const {endpoint, username, password} = this.options;
        const {IgniteClientConfiguration} = this.IgniteClient;
        let config = new IgniteClientConfiguration(...(Array.isArray(endpoint) ? endpoint : [endpoint]));
        if (username) config = config.setUserName(username);
        if (password) config = config.setPassword(password);

        await this.client.connect(config);
        const {schema} = this.options;
        const {CacheConfiguration} = this.IgniteClient;

        const cacheConfig = new CacheConfiguration().setSqlSchema(schema);
        const cache = await this.getOrCreateCache(this.options.schema, cacheConfig);
        this.cache = cache;
    }

    async afterConnect() {
    }

    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    async disconnect(): Promise<void> {
        return this.client.disconnect();
    }

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map((key) => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length) return [sql, escapedParameters];

        const keys = Object.keys(parameters)
            .map((parameter) => "(:(\\.\\.\\.)?" + parameter + "\\b)")
            .join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            let value: any;
            if (key.substr(0, 4) === ":...") {
                value = parameters[key.substr(4)];
            } else {
                value = parameters[key.substr(1)];
            }

            if (value instanceof Function) {
                return value();
            } else {
                escapedParameters.push(value);
                return "?";
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return '"' + columnName + '"';
    }

    buildTableName(tableName: string, schema?: string, database?: string): string {
        return tableName;
    }

    /**
     * @override
     */
    async obtainMasterConnection() {
    }

    /**
     * @override
     */
    async obtainSlaveConnection() {
    }

    normalizeType(column: {
        type?: ColumnType;
        length?: number | string;
        precision?: number | null;
        scale?: number;
    }): string {
        if (column.type === Number || column.type === "int") {
            return "int";
        } else if (column.type === String) {
            return "varchar";
        } else if (column.type === Date) {
            return "timestamp";
        } else if (column.type === Boolean) {
            return "boolean";
        } else {
            return (column.type as string) || "";
        }
    }

    normalizeIsUnique(): boolean {
        return false;
    }

    createFullType(column: TableColumn): string {
        return column.type;
    }

    normalizeDefault(columnMetadata: ColumnMetadata): string {
        const defaultValue = columnMetadata.default;

        if (typeof defaultValue === "number") {
            return "" + defaultValue;
        } else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "TRUE" : "FALSE";
        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;
        } else {
            return defaultValue;
        }
    }

    getColumnLength(column: ColumnMetadata | TableColumn): string {
        if (column.length) return column.length.toString();

        if (column.generationStrategy === "uuid") return "36";

        switch (column.type) {
            case String:
            case "varchar":
                return "255";
            default:
                return "";
        }
    }

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer) value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);

        if (value === null || value === undefined) return value;

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            return value === true ? 1 : 0;
        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);
        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);
        } else if (columnMetadata.type === "timestamp" || columnMetadata.type === Date) {
            return DateUtils.mixedDateToDate(value);
        }

        return value;
    }

    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined) {
            return value;
        }

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            value = value ? true : false;
        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            value = DateUtils.normalizeHydratedDate(value);
        } else if (columnMetadata.type === "json") {
            value = typeof value === "string" ? JSON.parse(value) : value;
        } else if (columnMetadata.type === "timestamp") {
            value = DateUtils.mixedTimeToString(value);
        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value);
        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value);
        } else if (
            (columnMetadata.type === "enum" || columnMetadata.type === "simple-enum") &&
            columnMetadata.enum &&
            !isNaN(value) &&
            columnMetadata.enum.indexOf(parseInt(value)) >= 0
        ) {
            value = parseInt(value);
        }

        if (columnMetadata.transformer) value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);

        return value;
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter((columnMetadata) => {
            const tableColumn = tableColumns.find((c) => c.name === columnMetadata.databaseName);
            if (!tableColumn) return false;

            return (
                tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                (columnMetadata.length && tableColumn.length !== this.getColumnLength(columnMetadata)) ||
                tableColumn.precision !== columnMetadata.precision ||
                tableColumn.scale !== columnMetadata.scale ||
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                tableColumn.isNullable !== columnMetadata.isNullable ||
                (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated)
            );
        });
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            let value: any;
            if (generatedColumn.generationStrategy === "increment" && insertResult) {
                value = insertResult;
                // } else if (generatedColumn.generationStrategy === "uuid") {
                //     console.log("getting db value:", generatedColumn.databaseName);
                //     value = generatedColumn.getEntityValue(uuidMap);
            }

            return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
        }, {} as ObjectLiteral);

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    }

    /**
     * @override
     * @param mode
     */
    createQueryRunner(mode: ReplicationMode) {
        return new IgniteQueryRunner(this);
    }

    getCache(cacheName: string) {
        return this.client.getCache(cacheName);
    }

    getDatabase() {
        return this.cache;
    }

    async getOrCreateCache(cacheName: string, config: any) {
        return this.client.getOrCreateCache(cacheName, config);
    }

    protected loadDependencies(): void {
        try {
            this.IgniteClient = require("apache-ignite-client");
        } catch (e) {
            throw new DriverPackageNotInstalledError("ignite", "apache-ignite-client");
        }
    }
}
