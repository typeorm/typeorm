import {
    BaseConnectionOptions,
    ColumnMetadata,
    ColumnType,
    DataTypeDefaults,
    Driver,
    EntityManager,
    EntityMetadata,
    MappedColumnTypes,
    ObjectLiteral,
    QueryRunner,
    SchemaBuilder,
    SelectQueryBuilder,
    TableColumn
} from "@typeorm/browser-core";

/**
 * Organizes communication with sqlite DBMS.
 */
export abstract class AbstractSqlDriver implements Driver {
    abstract dataTypeDefaults: DataTypeDefaults;
    entityManagerCls = EntityManager;
    SelectQueryBuilderCls = SelectQueryBuilder;
    abstract isReplicated: boolean;
    abstract mappedDataTypes: MappedColumnTypes;
    abstract options: BaseConnectionOptions;
    abstract spatialTypes: ColumnType[];
    abstract supportedDataTypes: ColumnType[];
    abstract treeSupport: boolean;
    abstract type: string;
    abstract withLengthColumnTypes: ColumnType[];
    abstract withPrecisionColumnTypes: ColumnType[];
    abstract withScaleColumnTypes: ColumnType[];

    abstract afterConnect(): Promise<void>;

    abstract buildTableName(tableName: string, schema?: string, database?: string): string;

    abstract connect(): Promise<void>;

    abstract createFullType(column: TableColumn): string;

    abstract createGeneratedMap(metadata: EntityMetadata, insertResult: any): ObjectLiteral | undefined;

    abstract createParameter(parameterName: string, index: number): string;

    abstract createQueryRunner(mode: "master" | "slave"): QueryRunner;

    abstract createSchemaBuilder(): SchemaBuilder;

    abstract disconnect(): Promise<void>;

    abstract escape(name: string): string;

    abstract escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]];

    abstract findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[];

    abstract getColumnLength(column: ColumnMetadata): string;

    abstract isReturningSqlSupported(): boolean;

    abstract isUUIDGenerationSupported(): boolean;

    abstract normalizeDefault(columnMetadata: ColumnMetadata): string;

    abstract normalizeIsUnique(column: ColumnMetadata): boolean;

    abstract normalizeType(column: { type?: ColumnType | string; length?: number | string; precision?: number | null; scale?: number; isArray?: boolean }): string;

    abstract obtainMasterConnection(): Promise<any>;

    abstract obtainSlaveConnection(): Promise<any>;

    abstract prepareHydratedValue(value: any, column: ColumnMetadata): any;

    abstract preparePersistentValue(value: any, column: ColumnMetadata): any;

}
