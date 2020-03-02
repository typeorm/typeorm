import { Driver } from "../Driver";
import { ColumnType } from "../types/ColumnTypes";
import { DataTypeDefaults } from "../types/DataTypeDefaults";
import { MappedColumnTypes } from "../types/MappedColumnTypes";
import { SchemaBuilder } from "../../schema-builder/SchemaBuilder";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { ObjectLiteral } from "../../common/ObjectLiteral";
import { ColumnMetadata } from "../../metadata/ColumnMetadata";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { EntityMetadata } from "../../metadata/EntityMetadata";
import { Connection } from "../../connection/Connection";
import { FirebirdConnectionOptions } from "./FirebirdConnectionOptions";
import { PlatformTools } from "../../platform/PlatformTools";
import { Database, Options, ConnectionPool } from "node-firebird";
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder";
import { FirebirdQueryRunner } from "./FirebirdQueryRunner";
import { DateUtils } from "../../util/DateUtils";
import { OrmUtils } from "../../util/OrmUtils";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";

export class FirebirdDriver implements Driver {
    options: FirebirdConnectionOptions;
    database?: string | undefined;
    isReplicated: boolean;
    treeSupport: boolean;

    supportedDataTypes: ColumnType[] = [
        "int",
        "smallint",
        "bigint",
        "float",
        "double precision",
        "decimal",
        "numeric",
        "date",
        "timestamp",
        "time",
        "char",
        "character",
        "varchar",
        "blob"
    ];

    dataTypeDefaults: DataTypeDefaults = {
        "varchar": { length: 255 },
        "char": { length: 1 },
        "decimal": { precision: 10, scale: 0 },
        "float": { precision: 12 },
        "double": { precision: 22 },
        "int": { width: 11 },
        "smallint": { width: 6 },
        "bigint": { width: 20 }
    };

    spatialTypes: ColumnType[];

    withLengthColumnTypes: ColumnType[] = [
        "char",
        "varchar",
        "character"
    ];

    withPrecisionColumnTypes: ColumnType[] = [
        "decimal",
        "numeric"
    ];

    withScaleColumnTypes: ColumnType[] = [
        "decimal",
        "numeric"
    ];

    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDatePrecision: 6,
        createDateDefault: "NOW",
        updateDate: "timestamp",
        updateDatePrecision: 6,
        updateDateDefault: "NOW",
        deleteDate: "timestamp",
        deleteDatePrecision: 6,
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
        cacheQuery: "blob",
        cacheResult: "blob",
        metadataType: "varchar",
        metadataDatabase: "varchar",
        metadataSchema: "varchar",
        metadataTable: "varchar",
        metadataName: "varchar",
        metadataValue: "blob sub_type text",
    };
    connection: Connection;
    /**
     * Database connection object from node-firebird
     */
    firebird: any;
    /**
     * Connection options for firebird connection
     */
    firebirdOptions: Options;

    /**
     * Database pool connection object from node-firebird
     */
    firebirdPool: ConnectionPool;

    /**
     * Firebrid database (no pooling)
     */
    firebirdDatabase: Database;

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as FirebirdConnectionOptions;
        this.firebirdOptions = connection.options as Options;

        // load mysql package
        this.firebird = PlatformTools.load("node-firebird");
    }

    async connect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (this.options.pooling) {
                this.firebirdPool = this.firebird.pool(5, this.firebirdOptions);
                this.firebirdPool.get((err, database) => {
                    if (err) {
                        fail(err);
                    }
                    this.firebirdDatabase = database;
                    ok();
                });
            } else {
                this.firebird.attachOrCreate(this.firebirdOptions, (err: any, database: Database) => {
                    if (err) {
                        fail(err);
                    }
                    this.firebirdDatabase = database;
                    ok();
                });
            }
        });
    }

    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            if (this.options.pooling) {
                this.firebirdPool.destroy();
                ok();
            } else {
                this.firebirdDatabase.detach(() => ok());
            }
        });
    }

    createSchemaBuilder(): SchemaBuilder {
        return new RdbmsSchemaBuilder(this.connection);
    }
    createQueryRunner(mode: "master" | "slave"): QueryRunner {
        return new FirebirdQueryRunner(this);
    }
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const escapedParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters];

        const keys = Object.keys(parameters).map(parameter => "(:(\\.\\.\\.)?" + parameter + "\\b)").join("|");
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
    escape(columnName: string): string {
        return `${columnName}`;
    }
    buildTableName(tableName: string, schema?: string | undefined, database?: string | undefined): string {
        return `${tableName}`;
    }
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata) {
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

        } else if (columnMetadata.type === "timestamp" || columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            return DateUtils.mixedDateToDate(value);

        }

        return value;
    }
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata) {
        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            value = value ? true : false;

        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            value = DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value);

        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);

        return value;
    }
    normalizeType(column: { type?: string | BooleanConstructor | DateConstructor | NumberConstructor | StringConstructor | undefined; length?: string | number | undefined; precision?: number | null | undefined; scale?: number | undefined; isArray?: boolean | undefined; }): string {
        if (column.type === Number || column.type === "integer") {
            return "int";

        } else if (column.type === String || column.type === "nvarchar") {
            return "varchar";

        } else if (column.type === Date) {
            return "datetime";

        } else if ((column.type as any) === Buffer) {
            return "blob";

        } else if (column.type === Boolean) {
            return "char";

        } else if (column.type === "numeric" || column.type === "dec") {
            return "numeric";

        } else if (column.type === "uuid") {
            return "varchar";

        } else if (column.type === "simple-array" || column.type === "simple-json") {
            return "blob";

        } else {
            return column.type as string || "";
        }
    }
    normalizeDefault(columnMetadata: ColumnMetadata): string {
        const defaultValue = columnMetadata.default;

        if (typeof defaultValue === "number") {
            return "" + defaultValue;

        } else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "T" : "F";

        } else if (typeof defaultValue === "function") {
            return defaultValue();

        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;

        } else {
            return defaultValue;
        }
    }
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.indices.some(idx => idx.isUnique && idx.columns.length === 1 && idx.columns[0] === column);
    }
    getColumnLength(column: ColumnMetadata|TableColumn): string {
        if (column.length)
        return column.length.toString();

        switch (column.type) {
            case String:
            case "varchar":
                return "255";
            case "uuid":
                return "36";
            default:
                return "";
        }
    }
    createFullType(column: TableColumn): string {
        let type = column.type;

        // used 'getColumnLength()' method, because Firebird requires column length for `varchar`, `nvarchar` and `varbinary` data types
        if (this.getColumnLength(column)) {
            type += `(${this.getColumnLength(column)})`;

        } else if (column.width) {
            type += `(${column.width})`;

        } else if (column.precision !== null && column.precision !== undefined && column.scale !== null && column.scale !== undefined) {
            type += `(${column.precision},${column.scale})`;

        } else if (column.precision !== null && column.precision !== undefined) {
            type += `(${column.precision})`;
        }

        if (column.isArray)
            type += " array";

        return type;
    }
    obtainMasterConnection(): Promise<any> {
        return this.connect();
    }
    obtainSlaveConnection(): Promise<any> {
        return this.connect();
    }
    createGeneratedMap(metadata: EntityMetadata, insertResult: any): ObjectLiteral | undefined {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            let value: any;
            if (generatedColumn.generationStrategy === "increment" && insertResult.insertId) {
                value = insertResult.insertId;
            }

            return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
        }, {} as ObjectLiteral);

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    }

    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[] {
        return columnMetadatas.filter(columnMetadata => {
            const tableColumn = tableColumns.find(c => c.name === columnMetadata.databaseName);
            if (!tableColumn)
                return false; // we don't need new columns, we only need exist and changed

            return tableColumn.name !== columnMetadata.databaseName
                || tableColumn.type !== this.normalizeType(columnMetadata)
                || tableColumn.length !== columnMetadata.length
                || tableColumn.width !== columnMetadata.width
                || tableColumn.precision !== columnMetadata.precision
                || tableColumn.scale !== columnMetadata.scale
                || tableColumn.zerofill !== columnMetadata.zerofill
                || tableColumn.unsigned !== columnMetadata.unsigned
                || tableColumn.asExpression !== columnMetadata.asExpression
                || tableColumn.generatedType !== columnMetadata.generatedType
                || tableColumn.onUpdate !== columnMetadata.onUpdate
                || tableColumn.isPrimary !== columnMetadata.isPrimary
                || tableColumn.isNullable !== columnMetadata.isNullable
                || tableColumn.isUnique !== this.normalizeIsUnique(columnMetadata)
                || (columnMetadata.generationStrategy !== "uuid" && tableColumn.isGenerated !== columnMetadata.isGenerated);
        });
    }
    isReturningSqlSupported(): boolean {
        return false;
    }
    isUUIDGenerationSupported(): boolean {
        return false;
    }
    createParameter(parameterName: string, index: number): string {
        return "?";
    }


}
