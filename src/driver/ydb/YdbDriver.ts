import { ObjectLiteral } from "../../common/ObjectLiteral"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { SchemaBuilder } from "../../schema-builder/SchemaBuilder"
import { Table } from "../../schema-builder/table/Table"
import { TableColumn } from "../../schema-builder/table/TableColumn"
import { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import { View } from "../../schema-builder/view/View"
import { Driver, ReturningType } from "../Driver"
import { ColumnType } from "../types/ColumnTypes"
import { CteCapabilities } from "../types/CteCapabilities"
import { DataTypeDefaults } from "../types/DataTypeDefaults"
import { MappedColumnTypes } from "../types/MappedColumnTypes"
import { ReplicationMode } from "../types/ReplicationMode"
import { UpsertType } from "../types/UpsertType"
import * as Ydb from "ydb-sdk"
import { DataSource } from "../../data-source"
import { YdbConnectionOptions } from "./YdbConnectionOptions"
import {
    ConnectionIsNotSetError,
    DriverPackageNotInstalledError,
} from "../../error"
import { YdbQueryRunner } from "./YdbQueryRunner"
import { RdbmsSchemaBuilder } from "../../schema-builder/RdbmsSchemaBuilder"
import { InstanceChecker } from "../../util/InstanceChecker"

// TODO: remove Ydb references to have no direct deps
export class YdbDriver implements Driver {
    connection: DataSource
    options: YdbConnectionOptions
    version?: string | undefined
    database?: string | undefined
    schema?: string | undefined
    isReplicated: boolean
    treeSupport: boolean
    transactionSupport: "simple" | "nested" | "none"

    /**
     * We do not store all created query runners because we don't need to release them.
     */
    // connectedQueryRunners: QueryRunner[] = []

    supportedDataTypes: ColumnType[] = [
        "decimal", // Only Decimal(22,9) is supported for table columns
        "int32",
        "int64",
        "uint8",
        "uint32",
        "uint64",
        "float",
        "double",
        "bool",
        "dyNumber",
        "string",
        "utf8",
        "date",
        "datetime",
        "timestamp",
        "interval",
        "json",
        "jsonDocument",
        "yson",
    ]
    supportedUpsertType?: UpsertType | undefined
    dataTypeDefaults: DataTypeDefaults
    spatialTypes: ColumnType[]
    withLengthColumnTypes: ColumnType[]
    withPrecisionColumnTypes: ColumnType[]
    withScaleColumnTypes: ColumnType[]

    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "CAST(CurrentUtcDatetime() AS Timestamp)",
        updateDate: "timestamp",
        updateDateDefault: "CAST(CurrentUtcDatetime() AS Timestamp)",
        deleteDate: "timestamp",
        deleteDateNullable: true,
        version: "int64",
        treeLevel: "int64",
        migrationId: "int64",
        migrationName: "utf8",
        migrationTimestamp: "int64",
        cacheId: "utf8",
        cacheIdentifier: "utf8",
        cacheTime: "int64",
        cacheDuration: "int64",
        cacheQuery: "utf8",
        cacheResult: "utf8",
        metadataType: "utf8",
        metadataDatabase: "utf8",
        metadataSchema: "utf8",
        metadataTable: "utf8",
        metadataName: "utf8",
        metadataValue: "utf8",
    }
    maxAliasLength?: number | undefined
    cteCapabilities: CteCapabilities

    // sdk specific vars
    /**
     * Ydb Sdk underlying library
     */
    Ydb: {
        Driver: typeof Ydb.Driver
    }

    /**
     * Ydb driver instance
     */
    driver: Ydb.Driver | undefined

    /**
     * Authentication service for Ydb Driver
     */
    authService: Ydb.IAuthService

    constructor(connection: DataSource) {
        this.connection = connection
        this.options = connection.options as YdbConnectionOptions
        this.transactionSupport = "none"

        // load ydb-sdk package
        this.loadDependencies()
    }

    async connect(): Promise<void> {
        if (this.driver)
            this.connection.logger.log(
                "warn",
                "Multiple `connect` calls for one intsance of YdbDriver",
            )

        const options = this.options
        const driverOptions: Ydb.IDriverSettings = {
            authService: this.authService,
            endpoint: options.endpoint,
            database: options.database,
            poolSettings: {},
        }
        if (options.gRpcClientOptions)
            driverOptions.clientOptions = options.gRpcClientOptions
        if (options.poolSettings)
            driverOptions.poolSettings = options.poolSettings
        this.driver = new this.Ydb.Driver(driverOptions)

        if (!(await this.driver.ready(options.connectTimeout))) {
            this.connection.logger.log(
                "warn",
                `Connection has not become ready in ${options.connectTimeout}ms!`,
            )
            throw new ConnectionIsNotSetError("ydb")
        }
        // ready doesn't mean that connection is successfull (investigate why)
    }

    async afterConnect(): Promise<void> {}

    async disconnect(): Promise<void> {
        await this.driver?.destroy()
        this.driver = undefined
    }
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        return new YdbQueryRunner(this, mode)
    }
    createSchemaBuilder(): SchemaBuilder {
        // TODO: Needs implementation
        return new RdbmsSchemaBuilder(this.connection)
    }
    escapeQueryWithParameters(
        sql: string,
        parameters: ObjectLiteral,
        nativeParameters: ObjectLiteral,
    ): [string, any[]] {
        throw new Error("Method not implemented.")
    }
    escape(name: string): string {
        throw new Error("Method not implemented.")
    }

    /**
     * Build full table name with database name, schema name and table name.
     */
    buildTableName(
        tableName: string,
        schema?: string | undefined,
        database?: string | undefined,
    ): string {
        let tablePath = [tableName]

        if (database) {
            tablePath.unshift(database)
        }

        return tablePath.join("/")
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     */
    parseTableName(
        target: EntityMetadata | Table | View | TableForeignKey | string,
    ): { tableName: string; schema?: string; database?: string } {
        const driverDatabase = this.database
        const driverSchema = undefined

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            const parsed = this.parseTableName(target.name)

            return {
                database: target.database || parsed.database || driverDatabase,
                schema: target.schema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            const parsed = this.parseTableName(target.referencedTableName)

            return {
                database:
                    target.referencedDatabase ||
                    parsed.database ||
                    driverDatabase,
                schema:
                    target.referencedSchema || parsed.schema || driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isEntityMetadata(target)) {
            // EntityMetadata tableName is never a path

            return {
                database: target.database || driverDatabase,
                schema: target.schema || driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split("/")

        return {
            database:
                (parts.length > 1 ? parts.slice(0, -1).join("/") : undefined) ||
                driverDatabase,
            schema: driverSchema,
            tableName: parts.length > 1 ? parts[parts.length - 1] : parts[0],
        }
    }

    preparePersistentValue(value: any, column: ColumnMetadata) {
        throw new Error("Method not implemented.")
    }
    prepareHydratedValue(value: any, column: ColumnMetadata) {
        throw new Error("Method not implemented.")
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: {
        type?: ColumnType | string
        length?: string | number | undefined
        precision?: number | null | undefined
        scale?: number | undefined
        isArray?: boolean | undefined
    }): string {
        const type = column.type
        if (type === Number || column.type === "integer") return "int64"
        if (type === String || column.type === "string") return "utf8"
        if (type === Boolean) return "bool"
        if (type === Date) return "timestamp"
        else return (column.type as string) || ""
    }
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        throw new Error("Method not implemented.")
    }
    normalizeIsUnique(column: ColumnMetadata): boolean {
        throw new Error("Method not implemented.")
    }
    getColumnLength(column: ColumnMetadata): string {
        throw new Error("Method not implemented.")
    }
    createFullType(column: TableColumn): string {
        throw new Error("Method not implemented.")
    }
    obtainMasterConnection(): Promise<any> {
        throw new Error("Method not implemented.")
    }
    obtainSlaveConnection(): Promise<any> {
        throw new Error("Method not implemented.")
    }
    createGeneratedMap(
        metadata: EntityMetadata,
        insertResult: any,
        entityIndex?: number | undefined,
        entityNum?: number | undefined,
    ): ObjectLiteral | undefined {
        throw new Error("Method not implemented.")
    }
    findChangedColumns(
        tableColumns: TableColumn[],
        columnMetadatas: ColumnMetadata[],
    ): ColumnMetadata[] {
        throw new Error("Method not implemented.")
    }
    isReturningSqlSupported(returningType: ReturningType): boolean {
        throw new Error("Method not implemented.")
    }
    isUUIDGenerationSupported(): boolean {
        throw new Error("Method not implemented.")
    }
    isFullTextColumnTypeSupported(): boolean {
        throw new Error("Method not implemented.")
    }
    createParameter(parameterName: string, index: number): string {
        throw new Error("Method not implemented.")
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        try {
            // TODO: Change Ydb to this:
            // const lib = PlatformTools.load("ydb")

            this.Ydb = {
                Driver: Ydb.Driver,
            }
            const authOptions = this.options.authentication
            switch (authOptions.type) {
                case "anonymous":
                    this.authService = new Ydb.AnonymousAuthService()
                    break
                case "token":
                    this.authService = new Ydb.TokenAuthService(
                        authOptions.token,
                    )
                    break
                case "IAM":
                    const IamOptions = (({ type, ...o }) => o)(authOptions)
                    this.authService = new Ydb.IamAuthService(IamOptions)
                    break
                case "metadata":
                    if (authOptions.metadataTokenService) {
                        this.authService = new Ydb.MetadataAuthService(
                            authOptions.metadataTokenService,
                        )
                    } else {
                        this.authService = new Ydb.MetadataAuthService()
                    }
                    break

                default:
                    throw new TypeError(
                        `Ydb created with not defined auth type ${
                            (authOptions as any)?.type
                        }`,
                    )
                    break
            }
        } catch (e) {
            console.error(e)
            throw new DriverPackageNotInstalledError("Ydb", "ydb-sdk")
        }
    }
}
